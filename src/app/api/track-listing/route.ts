// src/app/api/track-listing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const ALLOWED_KINDS = ["service", "product"] as const;
const ALLOWED_FIELDS = ["views", "whatsappClicks"] as const;

export async function POST(req: NextRequest) {
  try {
    const adminDb = getFirestoreDb();

    const body = await req.json();
    const { kind, id, field, userId, visitorId } = body as {
      kind?: string;
      id?: string;
      field?: string;
      userId?: string;
      visitorId?: string;
    };

    if (!id || typeof id !== "string" || id.length > 100) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    if (!kind || !ALLOWED_KINDS.includes(kind as any)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    if (!field || !ALLOWED_FIELDS.includes(field as any)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const collectionName = kind === "service" ? "services" : "products";
    const ref = adminDb.collection(collectionName).doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ─── 1. Increment the public view counter (Unique view logic) ───
    if (field === "views") {
      const viewId = `${kind}_${id}_${visitorId || "anon"}`;
      const viewRef = adminDb.collection("listingViews").doc(viewId);

      try {
        await adminDb.runTransaction(async (transaction) => {
          const viewDoc = await transaction.get(viewRef);
          
          // If they already viewed it, STOP. Do not increment.
          if (viewDoc.exists) {
            return;
          }

          // Otherwise, record the view and increment the counter
          transaction.set(viewRef, {
            kind,
            listingId: id,
            visitorId: visitorId || "anon",
            createdAt: FieldValue.serverTimestamp(),
          });
          
          transaction.update(ref, { views: FieldValue.increment(1) });
        });
      } catch (err) {
        console.warn("View tracking transaction failed:", err);
      }
    } 
    // ─── 2. Increment WhatsApp clicks (No unique check needed) ───
    else if (field === "whatsappClicks") {
      await ref.update({ [field]: FieldValue.increment(1) });

      if (userId && typeof userId === "string" && userId.length <= 100) {
        const clickId = `${userId}_${id}`;
        try {
          await adminDb.collection("whatsappClicks").doc(clickId).set(
            {
              userId,
              listingId: id,
              kind,
              clickedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } catch (clickErr) {
          console.error("whatsappClicks gate write failed:", clickErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("track-listing error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}