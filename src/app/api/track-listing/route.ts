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
    const { kind, id, field, userId } = body as {
      kind?: string;
      id?: string;
      field?: string;
      userId?: string;
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

    // userId is optional and only used for whatsappClicks — verify shape if given
    const validUserId =
      typeof userId === "string" && userId.length > 0 && userId.length <= 100
        ? userId
        : undefined;

    const collection = kind === "service" ? "services" : "products";
    const ref = adminDb.collection(collection).doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── 1. Increment the public counter (unchanged behavior) ──
    await ref.update({ [field]: FieldValue.increment(1) });

    // ── 2. Record per-user WhatsApp click (verified-review gate) ──
    // Only on whatsappClicks + a valid userId. Idempotent via set+merge.
    if (field === "whatsappClicks" && validUserId) {
      const clickId = `${validUserId}_${id}`;
      try {
        await adminDb
          .collection("whatsappClicks")
          .doc(clickId)
          .set(
            {
              userId: validUserId,
              listingId: id,
              kind,
              // Only set clickedAt on first write; merge preserves original
              clickedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      } catch (clickErr) {
        // Never fail the whole request because the gate record failed —
        // the public counter already succeeded and tracking is best-effort.
        console.error("whatsappClicks gate write failed:", clickErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("track-listing error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}