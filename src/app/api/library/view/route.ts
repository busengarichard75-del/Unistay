// src/app/api/library/view/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/library/view
 * Body: { id: string }
 *
 * Increments the `views` counter on a library entry by 1.
 * Uses admin SDK so it works for any viewer (guests too).
 * Fails silently — a view counter is not worth breaking the page for.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const id: string | undefined = body?.id;

    if (!id || typeof id !== "string" || id.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    const db = getFirestoreDb();
    const ref = db.collection("library").doc(id);

    // Only increment if the doc exists AND is approved + not hidden.
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    const data = snap.data() || {};
    if (data.adminHidden || data.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Not viewable" },
        { status: 403 }
      );
    }

    await ref.update({
      views: FieldValue.increment(1),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Library view increment failed:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// Block non-POST requests
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}