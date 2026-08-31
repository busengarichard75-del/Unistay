import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { notFound } from "next/navigation";
import { QRCodeDisplay } from "@/components/booking/QRCodeDisplay";
import { ConfirmationActions } from "@/components/booking/ConfirmationActions";
import { CheckCircle, Clock, XCircle, Home, User, Phone, MapPin, Calendar, DollarSign, Tag, ShieldCheck } from "lucide-react";

// Generate all booking IDs at build time
export async function generateStaticParams() {
  try {
    const bookingsRef = collection(db, "bookings");
    const snapshot = await getDocs(bookingsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
    }));
  } catch {
    return [];
  }
}

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;

  const docRef = doc(db, "bookings", id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    notFound();
  }

  const booking = { id: snap.id, ...snap.data() } as Booking;

  let landlordName: string | null = null;
  let landlordPhone: string | null = null;

  if (booking.status === "confirmed" && booking.landlordId) {
    const userRef = doc(db, "users", booking.landlordId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      landlordName = userData?.fullName || userData?.name || userData?.displayName || "Landlord";
      landlordPhone = userData?.phone || "Not provided";
    }
  }

  const hasConfirmation = booking.confirmationId && booking.confirmationCode;

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    confirmed: {
      label: "Confirmed",
      color: "text-green-700",
      bg: "bg-green-50 border-green-200",
      icon: <CheckCircle size={18} className="text-green-600" />,
    },
    approved: {
      label: "Approved",
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
      icon: <Clock size={18} className="text-blue-600" />,
    },
    requested: {
      label: "Pending",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      icon: <Clock size={18} className="text-amber-600" />,
    },
    rejected: {
      label: "Rejected",
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
      icon: <XCircle size={18} className="text-red-600" />,
    },
    expired: {
      label: "Expired",
      color: "text-gray-700",
      bg: "bg-gray-50 border-gray-200",
      icon: <XCircle size={18} className="text-gray-600" />,
    },
  };

  const statusInfo = statusConfig[booking.status] || {
    label: booking.status || "Unknown",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
    icon: <Clock size={18} className="text-gray-600" />,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";
  const verifyUrl = `${baseUrl}/verify/${booking.id}?token=${booking.verificationToken || ""}`;

  const isConfirmed = booking.status === "confirmed";
  const isApproved = booking.status === "approved";

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Confirmation Card */}
        <div
          id="confirmation-card"
          className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--nexora-navy)] to-[var(--nexora-primary)] px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Peza Booking Pass</h1>
                <p className="text-sm text-white/70">Official accommodation confirmation</p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                <ShieldCheck size={14} className="text-white/70" />
                <span className="text-xs font-medium text-white/80">Verified</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`mx-6 mt-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 ${statusInfo.bg}`}>
            {statusInfo.icon}
            <span className={`text-sm font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {booking.confirmationId && (
              <span className="ml-auto text-xs text-gray-400 font-mono">
                #{booking.confirmationId}
              </span>
            )}
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-5">
            {/* Property & Student */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3.5 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Home size={14} />
                  <span>Property</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{booking.propertyTitle}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3.5 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <User size={14} />
                  <span>Student</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{booking.studentName}</p>
                <p className="text-xs text-gray-400">ID: {booking.studentNumber || "N/A"}</p>
              </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <DollarSign size={12} />
                  <span>Price</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  K{booking.price.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400">
                    /{booking.paymentPeriod === "termly" ? "term" : "month"}
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <MapPin size={12} />
                  <span>Bed Space</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{booking.bedSpaceId}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Calendar size={12} />
                  <span>Requested</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
              {booking.approvedAt && (
                <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <CheckCircle size={12} />
                    <span>Approved</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(booking.approvedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {booking.confirmedAt && (
                <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <ShieldCheck size={12} />
                    <span>Confirmed</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(booking.confirmedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Landlord Details (if confirmed) */}
            {isConfirmed && landlordName && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-green-700 mb-1.5">
                  <Phone size={14} />
                  <span>Landlord Contact Details</span>
                </div>
                <div className="flex flex-col gap-0.5 text-sm">
                  <p>
                    <span className="font-medium text-gray-700">Name:</span> {landlordName}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Phone:</span> {landlordPhone}
                  </p>
                </div>
                <p className="mt-1 text-xs text-green-600">
                  📌 Contact your landlord directly for check-in arrangements.
                </p>
              </div>
            )}

            {isApproved && !isConfirmed && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-sm text-blue-700">
                  📌 Landlord contact details will appear here after your booking is confirmed.
                </p>
              </div>
            )}

            {/* QR Code Section */}
            {hasConfirmation && booking.status !== "rejected" && booking.status !== "expired" && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col items-center">
                  <p className="text-xs text-gray-400 mb-2">Scan to verify this booking</p>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                    <QRCodeDisplay value={verifyUrl} size={160} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    Code: {booking.confirmationCode}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
              <p>This confirmation is valid for the stated booking.</p>
              <p className="mt-0.5">
                For questions, contact Peza support at +260 0771319817 or pezaaccommodation@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Buttons */}
        <div className="mt-4">
          <ConfirmationActions />
        </div>
      </div>
    </main>
  );
}