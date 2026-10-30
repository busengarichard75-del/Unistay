import { getFirestoreDb } from "@/lib/firebase-admin";
import { Booking } from "@/types/booking";
import { notFound } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

// ✅ Force dynamic rendering because we need searchParams
export const dynamic = "force-dynamic";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  const adminDb = getFirestoreDb();
  const docRef = adminDb.collection("bookings").doc(id);
  const snap = await docRef.get();

  if (!snap.exists) {
    notFound();
  }

  const booking = { id: snap.id, ...snap.data() } as Booking;

  // ─── Security check: The token must match exactly ───
  const isTokenValid =
    token && booking.verificationToken && token === booking.verificationToken;

  if (!isTokenValid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg border border-red-100">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="text-xl font-bold text-red-600">Invalid Token</h1>
          <p className="mt-2 text-sm text-gray-500">
            This verification link is invalid, expired, or has been tampered with.
            Please ask the student to show you their booking on their dashboard.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-gray-100 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            Go to Homepage
          </Link>
        </div>
      </main>
    );
  }

  let landlordName: string | null = null;
  let landlordPhone: string | null = null;

  if (booking.status === "confirmed" && booking.landlordId) {
    const userRef = adminDb.collection("users").doc(booking.landlordId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const userData = userSnap.data();
      landlordName =
        userData?.fullName || userData?.name || userData?.displayName || "Landlord";
      landlordPhone = userData?.phone || "Not provided";
    }
  }

  let statusIcon;
  let statusMessage;
  let statusColor;

  if (booking.status === "confirmed") {
    statusIcon = <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />;
    statusMessage = "This booking is CONFIRMED.";
    statusColor = "text-green-600";
  } else if (booking.status === "approved") {
    statusIcon = <CheckCircle className="w-10 h-10 text-blue-500 mx-auto" />;
    statusMessage = "This booking is APPROVED.";
    statusColor = "text-blue-600";
  } else if (booking.status === "rejected") {
    statusIcon = <XCircle className="w-10 h-10 text-red-500 mx-auto" />;
    statusMessage = "This booking has been REJECTED.";
    statusColor = "text-red-600";
  } else {
    statusIcon = <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />;
    statusMessage = "This booking is still PENDING.";
    statusColor = "text-amber-600";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-xl border border-gray-100">
        <div className="bg-gray-50/50 px-6 py-8">
          {statusIcon}
          <h1 className={`mt-4 text-2xl font-bold ${statusColor}`}>{statusMessage}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Booking ID: <span className="font-mono text-gray-700">{booking.confirmationId || booking.id}</span>
          </p>
        </div>

        <div className="px-6 py-6 border-t border-gray-100">
          <div className="space-y-3 text-left bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Student</p>
              <p className="text-sm font-medium text-gray-900">{booking.studentName}</p>
              {booking.studentNumber && (
                <p className="text-xs text-gray-500">ID: {booking.studentNumber}</p>
              )}
            </div>
            
            <div className="h-px w-full bg-gray-200" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Property</p>
              <p className="text-sm font-medium text-gray-900">{booking.propertyTitle}</p>
              {booking.confirmationCode && (
                <p className="text-xs text-gray-500 mt-1">Code: <span className="font-mono">{booking.confirmationCode}</span></p>
              )}
            </div>
          </div>

          {booking.status === "confirmed" && landlordName && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
              <p className="text-xs font-bold text-green-800 mb-2">🏠 Landlord Details</p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Name:</span> {landlordName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Phone:</span> {landlordPhone}
              </p>
            </div>
          )}

          {booking.status === "approved" && (
            <p className="mt-4 text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
              📌 Landlord contact details will appear once the booking is confirmed by the admin.
            </p>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 text-center text-[10px] text-gray-400">
          <p>Secured and Verified by Peza</p>
          <p>Always check booking status before handing over the property.</p>
        </div>
      </div>
    </main>
  );
}