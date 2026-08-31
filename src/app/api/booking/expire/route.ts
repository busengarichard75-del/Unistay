// src/app/api/booking/expire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { isBookingExpired } from "@/lib/bookingExpiration";
import webpush from "web-push";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { createNotification } from "@/services/notificationService"; // ✅ NEW

export async function POST(req: NextRequest) {
  try {
    const db = getFirestoreDb();

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !email) {
      return NextResponse.json(
        { error: "VAPID keys are not configured." },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);

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

      // Send push notifications and create in-app notifications for each expired booking
      for (const booking of expired) {
        // ─── STUDENT ───
        const studentTitle = "⏰ Booking Expired";
        const studentBody = `Your booking at "${booking.propertyTitle}" has expired. The bed is now available again.`;

        // Push notification
        const studentPayload = JSON.stringify({
          title: studentTitle,
          body: studentBody,
          icon: "/favicon.ico",
          url: "/dashboard/student",
        });

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
            await webpush.sendNotification(subscription, studentPayload);
          } catch {
            // Silently fail
          }
        }

        // ✅ In-app notification for student
        try {
          await createNotification(booking.studentId, {
            title: studentTitle,
            body: studentBody,
            type: "booking_expired",
            link: "/dashboard/student",
          });
        } catch {
          // Silently fail
        }

        // ─── LANDLORD ───
        const landlordTitle = "⏰ Booking Expired";
        const landlordBody = `A booking at "${booking.propertyTitle}" has expired. The bed is now available.`;

        // Push notification
        const landlordPayload = JSON.stringify({
          title: landlordTitle,
          body: landlordBody,
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

        // ✅ In-app notification for landlord
        try {
          await createNotification(booking.landlordId, {
            title: landlordTitle,
            body: landlordBody,
            type: "booking_expired",
            link: "/dashboard/landlord",
          });
        } catch {
          // Silently fail
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