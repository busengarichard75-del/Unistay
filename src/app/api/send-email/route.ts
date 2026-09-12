// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { sendBookingEmail, BookingEmailType } from "@/lib/sendBookingEmail";

export const runtime = "nodejs";

const VALID_TYPES: BookingEmailType[] = [
  "booking_requested",
  "booking_approved",
  "booking_confirmed",
  "booking_rejected",
  "booking_expired",
  "student_checked_in",
];

// Which user should receive each email type
function primaryRecipient(
  type: BookingEmailType,
  booking: Booking
): { role: "student" | "landlord"; userId: string } {
  switch (type) {
    case "booking_requested":
    case "student_checked_in":
      return { role: "landlord", userId: booking.landlordId };
    case "booking_approved":
    case "booking_confirmed":
    case "booking_rejected":
    case "booking_expired":
    default:
      return { role: "student", userId: booking.studentId };
  }
}

async function fetchUser(userId: string) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Record<string, unknown> & {
      id: string;
      email?: string;
      emailAddress?: string;
      fullName?: string;
      name?: string;
      displayName?: string;
      phone?: string;
      phoneNumber?: string;
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bookingId = body?.bookingId as string | undefined;
    const type = body?.type as BookingEmailType | undefined;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId" },
        { status: 400 }
      );
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing type" },
        { status: 400 }
      );
    }

    // 1. Fetch booking (fresh, authoritative)
    const bookingSnap = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }
    const booking = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;

    // 2. Fetch student + landlord (both, since templates need context)
    const [student, landlord] = await Promise.all([
      fetchUser(booking.studentId),
      fetchUser(booking.landlordId),
    ]);

    // 3. Pick primary recipient
    const { role, userId } = primaryRecipient(type, booking);
    const recipientUser = role === "student" ? student : landlord;

    const recipientEmail =
      recipientUser?.email || recipientUser?.emailAddress || null;

    if (!recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: `Recipient (${role}) has no email on file`,
        },
        { status: 400 }
      );
    }

    // 4. Send primary email
    const result = await sendBookingEmail({
      to: recipientEmail,
      type,
      booking,
      studentName: student?.fullName || student?.name || booking.studentName,
      studentEmail: student?.email || student?.emailAddress,
      landlordName:
        landlord?.fullName || landlord?.name || landlord?.displayName,
      landlordPhone: landlord?.phone || landlord?.phoneNumber,
      landlordEmail: landlord?.email || landlord?.emailAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 5. Bonus: on confirmed, also send to landlord (fire & forget)
    if (
      type === "booking_confirmed" &&
      landlord?.email &&
      landlord.email !== recipientEmail
    ) {
      // Fire-and-forget — failure here doesn't affect primary
      sendBookingEmail({
        to: landlord.email,
        type: "booking_confirmed",
        booking,
        studentName: student?.fullName || student?.name || booking.studentName,
        studentEmail: student?.email,
        landlordName: landlord?.fullName || landlord?.name,
        landlordPhone: landlord?.phone || landlord?.phoneNumber,
        landlordEmail: landlord.email,
      }).catch(() => {
        // Silently ignore — primary already succeeded
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-email route error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}