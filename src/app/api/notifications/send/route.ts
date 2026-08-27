// src/app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import webpush from "web-push";

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

    const { userId, title, body, url, icon } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: "Missing required fields: userId, title, body" },
        { status: 400 }
      );
    }

    // Get all subscriptions for this user
    const subscriptionsSnapshot = await db
      .collection("pushSubscriptions")
      .where("userId", "==", userId)
      .get();

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json(
        { error: "No push subscriptions found for this user" },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/favicon.ico",
      url: url || "/dashboard/student",
    });

    const results = [];
    let sentCount = 0;

    for (const doc of subscriptionsSnapshot.docs) {
      const subData = doc.data();
      const subscription = {
        endpoint: subData.endpoint,
        keys: {
          p256dh: subData.keys.p256dh,
          auth: subData.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, payload);
        sentCount++;
        results.push({ endpoint: subData.endpoint, status: "success" });
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await doc.ref.delete();
          results.push({ endpoint: subData.endpoint, status: "removed" });
        } else {
          results.push({ endpoint: subData.endpoint, status: "failed", error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: subscriptionsSnapshot.size,
      results,
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 }
    );
  }
}