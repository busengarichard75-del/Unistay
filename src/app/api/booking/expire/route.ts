// src/app/api/booking/expire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { isBookingExpired } from "@/lib/bookingExpiration";
import webpush from "web-push";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

// Configure web-push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get all approved bookings for this user
    const bookingsSnapshot = await db
      .collection("bookings")
      .where("studentId", "==", userId)
      .where("status", "==", "approved")
      .get();

    const expired: any[] = [];
    const batch = db.batch();

    bookingsSnapshot.forEach((doc: QueryDocumentSnapshot) => {
      const booking = { id: doc.id, ...doc.data() } as any;
      if (isBookingExpired(booking)) {
        batch.update(doc.ref, {
          status: "expired",
          expiredAt: Date.now(),
        });
        expired.push(booking);
      }
    });

    if (expired.length > 0) {
      await batch.commit();

      // ─── Send push notifications for each expired booking ───
      for (const booking of expired) {
        const payload = JSON.stringify({
          title: "⏰ Booking Expired",
          body: `Your booking at "${booking.propertyTitle}" has expired. The bed is now available again.`,
          icon: "/favicon.ico",
          url: "/dashboard/student",
        });

        // Notify student
        const studentSubs = await db
          .collection("pushSubscriptions")
          .where("userId", "==", booking.studentId)
          .get();

        for (const subDoc of studentSubs.docs) {
          const subData = subDoc.data();
          const subscription = {
            endpoint: subData.endpoint,
            keys: { p256dh: subData.keys.p256dh, auth: subData.keys.auth },
          };
          try {
            await webpush.sendNotification(subscription, payload);
          } catch {
            // Silently fail
          }
        }

        // Notify landlord
        const landlordPayload = JSON.stringify({
          title: "⏰ Booking Expired",
          body: `A booking at "${booking.propertyTitle}" has expired. The bed is now available.`,
          icon: "/favicon.ico",
          url: "/dashboard/landlord",
        });

        const landlordSubs = await db
          .collection("pushSubscriptions")
          .where("userId", "==", booking.landlordId)
          .get();

        for (const subDoc of landlordSubs.docs) {
          const subData = subDoc.data();
          const subscription = {
            endpoint: subData.endpoint,
            keys: { p256dh: subData.keys.p256dh, auth: subData.keys.auth },
          };
          try {
            await webpush.sendNotification(subscription, landlordPayload);
          } catch {
            // Silently fail
          }
        }
      }
    }

    return NextResponse.json({
      expired: expired.map((b) => b.id),
      count: expired.length,
    });
  } catch (error) {
    console.error("Expiration check error:", error);
    return NextResponse.json(
      { error: "Failed to check expired bookings" },
      { status: 500 }
    );
  }
}