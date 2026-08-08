import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { notFound } from "next/navigation";
import { QRCodeDisplay } from "@/components/booking/QRCodeDisplay";
import { ConfirmationActions } from "@/components/booking/ConfirmationActions";

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
      landlordName = userData?.name || userData?.displayName || "Landlord";
      landlordPhone = userData?.phone || "Not provided";
    }
  }

  const hasConfirmation = booking.confirmationId && booking.confirmationCode;

  const statusMap: Record<string, { label: string; color: string }> = {
    approved: { label: "✅ Approved", color: "text-blue-600" },
    confirmed: { label: "✅ Confirmed", color: "text-green-600" },
    rejected: { label: "❌ Rejected", color: "text-red-600" },
    requested: { label: "⏳ Pending", color: "text-amber-600" },
  };
  const statusInfo = statusMap[booking.status] || { label: booking.status, color: "text-gray-600" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://unistay-6634c.web.app";
  const verifyUrl = `${baseUrl}/verify/${booking.id}?token=${booking.verificationToken || ""}`;

  const isConfirmed = booking.status === "confirmed";

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div id="confirmation-card" className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:p-4">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">UniStay Booking Confirmation</h1>
            <p className="text-sm text-gray-500">Official booking pass</p>
          </div>

          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3 mb-4">
            <span className="text-sm font-medium text-gray-600">Booking ID</span>
            <span className="text-sm font-mono font-semibold">
              {booking.confirmationId || booking.id}
            </span>
          </div>

          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <span className={`text-sm font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Student</p>
              <p className="font-medium">{booking.studentName}</p>
            </div>
            <div>
              <p className="text-gray-500">Student ID</p>
              <p className="font-medium">{booking.studentNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Property</p>
              <p className="font-medium">{booking.propertyTitle}</p>
            </div>
            <div>
              <p className="text-gray-500">Bed Space</p>
              <p className="font-medium">{booking.bedSpaceId}</p>
            </div>
            <div>
              <p className="text-gray-500">Price</p>
              <p className="font-medium">
                K{booking.price} / {booking.paymentPeriod === "termly" ? "term" : "month"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Requested</p>
              <p className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
            {booking.approvedAt && (
              <div>
                <p className="text-gray-500">Approved</p>
                <p className="font-medium">{new Date(booking.approvedAt).toLocaleDateString()}</p>
              </div>
            )}
            {booking.confirmedAt && (
              <div>
                <p className="text-gray-500">Confirmed</p>
                <p className="font-medium">{new Date(booking.confirmedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {isConfirmed && landlordName && (
            <div className="mt-4 border-t pt-4 border-green-100">
              <p className="text-xs font-medium text-green-700 mb-1">🏠 Landlord Details</p>
              <p className="text-sm">
                <span className="font-medium">Name:</span> {landlordName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span> {landlordPhone}
              </p>
              <p className="text-xs text-gray-400 mt-1">Contact your landlord directly for check-in arrangements.</p>
            </div>
          )}

          {!isConfirmed && booking.status === "approved" && (
            <div className="mt-4 border-t pt-4 border-blue-100">
              <p className="text-xs text-blue-600">
                📌 Landlord contact details will appear here after your booking is confirmed.
              </p>
            </div>
          )}

          {hasConfirmation && booking.status !== "rejected" && (
            <div className="mt-6 flex flex-col items-center border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">Scan to verify this booking</p>
              <QRCodeDisplay value={verifyUrl} size={140} />
              <p className="text-xs text-gray-400 mt-2">Code: {booking.confirmationCode}</p>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
            <p>This confirmation is valid for the stated booking.</p>
            <p>For questions, contact UniStay support.</p>
          </div>
        </div>

        {/* Interactive buttons – Client Component */}
        <ConfirmationActions />
      </div>
    </main>
  );
}