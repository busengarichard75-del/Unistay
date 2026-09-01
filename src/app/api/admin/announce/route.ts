// src/app/api/admin/announce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import webpush from "web-push";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const db = getFirestoreDb();

    // ─── VAPID setup ───────────────────────────────────────────
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

    const { title, body, url, targetRole } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Missing title or body" },
        { status: 400 }
      );
    }

    // ─── Get target users ──────────────────────────────────────
    let targetUserIds: string[] = [];

    if (targetRole) {
      const usersSnapshot = await db
        .collection("users")
        .where("role", "==", targetRole)
        .get();
      targetUserIds = usersSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.id);
    } else {
      // All users: fetch all user IDs
      const allUsers = await db.collection("users").get();
      targetUserIds = allUsers.docs.map((doc: QueryDocumentSnapshot) => doc.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found for the selected target.",
        sent: 0,
      });
    }

    // ─── Create in‑app notifications for each user ────────────
    const notificationData = {
      title,
      body,
      type: "announcement" as const,
      link: url || "/",
      read: false,
      createdAt: Date.now(),
    };

    // Batch writes to Firestore (up to 500 per batch)
    const batch = db.batch();
    const notificationRefs: any[] = [];

    for (const userId of targetUserIds) {
      const docRef = db.collection("notifications").doc();
      batch.set(docRef, {
        userId,
        ...notificationData,
      });
      notificationRefs.push(docRef);
    }

    await batch.commit();

    // ─── Send push notifications to subscribed users ──────────
    let pushSent = 0;
    // We need to get subscriptions for all target users
    // Since `where("userId", "in", ...)` has a limit of 10 items, we process in chunks
    const chunkSize = 10;
    const subscriptionResults = [];

    for (let i = 0; i < targetUserIds.length; i += chunkSize) {
      const chunk = targetUserIds.slice(i, i + chunkSize);
      const subsSnapshot = await db
        .collection("pushSubscriptions")
        .where("userId", "in", chunk)
        .get();

      if (subsSnapshot.empty) continue;

      const payload = JSON.stringify({
        title: `📢 ${title}`,
        body,
        icon: "/favicon.ico",
        url: url || "/",
      });

      for (const doc of subsSnapshot.docs) {
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
          pushSent++;
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await doc.ref.delete(); // remove invalid subscription
          }
        }
      }
    }

    // ─── Log the announcement ──────────────────────────────────
    await db.collection("announcements").add({
      title,
      body,
      targetRole: targetRole || "all",
      userCount: targetUserIds.length,
      pushSent,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Announcement sent to ${targetUserIds.length} users. Push notifications sent to ${pushSent} subscribers.`,
      total: targetUserIds.length,
      pushSent,
    });
  } catch (error) {
    console.error("Admin announcement error:", error);
    return NextResponse.json(
      { error: "Failed to send announcement" },
      { status: 500 }
    );
  }
}