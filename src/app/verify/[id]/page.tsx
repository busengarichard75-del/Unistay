import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { notFound } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

// ✅ Force dynamic rendering because we need searchParams
export const dynamic = "force-dynamic";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

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

  const isTokenValid = token && booking.verificationToken && token === booking.verificationToken;

  let statusIcon;
  let statusMessage;
  let statusColor;

  if (booking.status === "confirmed") {
    statusIcon = <CheckCircle className="w-8 h-8 text-green-500" />;
    statusMessage = "This booking is CONFIRMED.";
    statusColor = "text-green-600";
  } else if (booking.status === "approved") {
    statusIcon = <CheckCircle className="w-8 h-8 text-blue-500" />;
    statusMessage = "This booking is APPROVED.";
    statusColor = "text-blue-600";
  } else if (booking.status === "rejected") {
    statusIcon = <XCircle className="w-8 h-8 text-red-500" />;
    statusMessage = "This booking has been REJECTED.";
    statusColor = "text-red-600";
  } else {
    statusIcon = <AlertCircle className="w-8 h-8 text-amber-500" />;
    statusMessage = "This booking is still PENDING.";
    statusColor = "text-amber-600";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">{statusIcon}</div>
        <h1 className={`text-2xl font-bold ${statusColor}`}>{statusMessage}</h1>
        <p className="text-sm text-gray-500 mt-2">Booking ID: {booking.confirmationId || booking.id}</p>
        <p className="text-sm text-gray-500">Student: {booking.studentName}</p>
        {booking.studentNumber && (
          <p className="text-sm text-gray-500">Student ID: {booking.studentNumber}</p>
        )}
        <p className="text-sm text-gray-500">Property: {booking.propertyTitle}</p>
        {booking.confirmationCode && (
          <p className="text-sm text-gray-500 mt-1">Code: {booking.confirmationCode}</p>
        )}

        {booking.status === "confirmed" && landlordName && (
          <div className="mt-4 border-t border-green-100 pt-4">
            <p className="text-xs font-medium text-green-700 mb-1">🏠 Landlord Details</p>
            <p className="text-sm">
              <span className="font-medium">Name:</span> {landlordName}
            </p>
            <p className="text-sm">
              <span className="font-medium">Phone:</span> {landlordPhone}
            </p>
          </div>
        )}

        {booking.status === "approved" && (
          <p className="text-xs text-blue-600 mt-4">📌 Landlord contact details will appear once the booking is confirmed.</p>
        )}

        <div className="mt-6 text-xs text-gray-400 border-t pt-4">
          <p>Verified by UniStay. Always check booking status before handing over the property.</p>
        </div>
      </div>
    </main>
  );
}