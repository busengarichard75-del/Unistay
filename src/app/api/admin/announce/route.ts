// src/app/api/admin/announce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import webpush from "web-push";
import { QueryDocumentSnapshot, Query } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const db = getFirestoreDb();

    // Configure web-push inside the handler
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !email) {
      return NextResponse.json(
        { error: "VAPID keys are not configured. Please set VAPID environment variables." },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);

    const { title, body, url, targetRole } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Missing title or body" },
        { status: 400 }
      );
    }

    // Build the query for push subscriptions
    let subscriptionsQuery: Query = db.collection("pushSubscriptions");

    if (targetRole) {
      // Fetch users with the given role
      const usersSnapshot = await db
        .collection("users")
        .where("role", "==", targetRole)
        .get();

      const userIds = usersSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.id);

      if (userIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No users found with this role",
          sent: 0,
        });
      }

      // Now query subscriptions for those user IDs
      subscriptionsQuery = db
        .collection("pushSubscriptions")
        .where("userId", "in", userIds);
    }

    const subscriptionsSnapshot = await subscriptionsQuery.get();

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No push subscriptions found",
        sent: 0,
      });
    }

    const payload = JSON.stringify({
      title: `📢 ${title}`,
      body,
      icon: "/favicon.ico",
      url: url || "/",
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
          results.push({ endpoint: subData.endpoint, status: "failed" });
        }
      }
    }

    // Log the announcement
    await db.collection("announcements").add({
      title,
      body,
      targetRole: targetRole || "all",
      sentCount,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: subscriptionsSnapshot.size,
      results,
    });
  } catch (error) {
    console.error("Admin announcement error:", error);
    return NextResponse.json(
      { error: "Failed to send announcements" },
      { status: 500 }
    );
  }
}