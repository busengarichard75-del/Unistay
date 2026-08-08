"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { useParams } from "next/navigation";
import { QRCodeDisplay } from "@/components/booking/QRCodeDisplay";

export function ConfirmationContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [landlordName, setLandlordName] = useState<string | null>(null);
  const [landlordPhone, setLandlordPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "bookings", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Booking;
          setBooking(data);

          if (data.status === "confirmed" && data.landlordId) {
            const userRef = doc(db, "users", data.landlordId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setLandlordName(userData?.name || userData?.displayName || "Landlord");
              setLandlordPhone(userData?.phone || "Not provided");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p>Loading confirmation...</p>;
  if (!booking) return <p>Booking not found.</p>;

  const hasConfirmation = booking.confirmationId && booking.confirmationCode;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://unistay-6634c.web.app";
  const verifyUrl = `${baseUrl}/verify/${booking.id}?token=${booking.verificationToken || ""}`;
  const isConfirmed = booking.status === "confirmed";

  const statusMap: Record<string, { label: string; color: string }> = {
    approved: { label: "✅ Approved", color: "text-blue-600" },
    confirmed: { label: "✅ Confirmed", color: "text-green-600" },
    rejected: { label: "❌ Rejected", color: "text-red-600" },
    requested: { label: "⏳ Pending", color: "text-amber-600" },
  };
  const statusInfo = statusMap[booking.status] || { label: booking.status, color: "text-gray-600" };

  return (
    <div id="confirmation-card" className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:p-4">
      {/* Header */}
      <div className="text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">UniStay Booking Confirmation</h1>
        <p className="text-sm text-gray-500">Official booking pass</p>
      </div>

      {/* Booking ID */}
      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3 mb-4">
        <span className="text-sm font-medium text-gray-600">Booking ID</span>
        <span className="text-sm font-mono font-semibold">
          {booking.confirmationId || booking.id}
        </span>
      </div>

      {/* Status */}
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <span className="text-sm font-medium text-gray-600">Status</span>
        <span className={`text-sm font-semibold ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Details grid */}
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
          <p className="font-medium">K{booking.price} / {booking.paymentPeriod === "termly" ? "term" : "month"}</p>
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

      {/* Landlord contact – only if confirmed */}
      {isConfirmed && landlordName && (
        <div className="mt-4 border-t pt-4 border-green-100">
          <p className="text-xs font-medium text-green-700 mb-1">🏠 Landlord Details</p>
          <p className="text-sm"><span className="font-medium">Name:</span> {landlordName}</p>
          <p className="text-sm"><span className="font-medium">Phone:</span> {landlordPhone}</p>
          <p className="text-xs text-gray-400 mt-1">Contact your landlord directly for check-in arrangements.</p>
        </div>
      )}

      {!isConfirmed && booking.status === "approved" && (
        <div className="mt-4 border-t pt-4 border-blue-100">
          <p className="text-xs text-blue-600">📌 Landlord contact details will appear here after your booking is confirmed.</p>
        </div>
      )}

      {/* QR Code */}
      {hasConfirmation && booking.status !== "rejected" && (
        <div className="mt-6 flex flex-col items-center border-t pt-4">
          <p className="text-xs text-gray-500 mb-2">Scan to verify this booking</p>
          <QRCodeDisplay value={verifyUrl} size={140} />
          <p className="text-xs text-gray-400 mt-2">Code: {booking.confirmationCode}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
        <p>This confirmation is valid for the stated booking.</p>
        <p>For questions, contact UniStay support.</p>
      </div>

      {/* Print button */}
      <div className="mt-6 flex gap-4 justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-[var(--nexora-primary)] text-white rounded-full hover:bg-[var(--nexora-primary-hover)] transition"
        >
          🖨️ Print Confirmation
        </button>
        <a href="/" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition">Home</a>
      </div>
    </div>
  );
}