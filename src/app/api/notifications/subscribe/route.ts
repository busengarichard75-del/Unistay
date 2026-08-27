// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: "Missing userId or subscription" },
        { status: 400 }
      );
    }

    // Store subscription in Firestore
    const subscriptionData = {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      createdAt: Date.now(),
      userAgent: req.headers.get("user-agent") || "",
    };

    const docRef = db.collection("pushSubscriptions").doc(subscription.endpoint);
    await docRef.set(subscriptionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}