// src/app/api/track-listing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const ALLOWED_KINDS = ["service", "product"] as const;
const ALLOWED_FIELDS = ["views", "whatsappClicks"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kind, id, field } = body as {
      kind?: string;
      id?: string;
      field?: string;
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

    const collection = kind === "service" ? "services" : "products";
    const ref = adminDb.collection(collection).doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({ [field]: FieldValue.increment(1) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("track-listing error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}