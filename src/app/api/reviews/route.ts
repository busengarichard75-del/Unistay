// src/app/api/reviews/route.ts
//
// Reviews & ratings — server-side writes with Admin SDK.
//
// Actions:
//   upsert       → create or edit a review (WhatsApp-click gate enforced)
//   delete       → remove a review (author / listing owner / admin)
//   reply        → owner adds or replaces their one reply
//   delete_reply → owner removes their reply
//
// Auth: Firebase ID token in Authorization: Bearer. Caller uid comes ONLY
// from the verified token, never from the request body.
//
// Aggregates recomputed server-side (listing + provider) after every write
// that changes review count/avg.

import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, getAuthAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const ADMIN_EMAIL = "busengarichard75@gmail.com";
const ALLOWED_TARGET_TYPES = ["service", "product"] as const;
type TargetType = (typeof ALLOWED_TARGET_TYPES)[number];

// ─────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────

function collectionFor(t: TargetType): "services" | "products" {
  return t === "service" ? "services" : "products";
}

function normalizeRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n);
  if (r < 1) return 1;
  if (r > 5) return 5;
  return r;
}

function normalizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  return t.slice(0, 1000);
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t ? t.slice(0, 100) : null;
}

function normalizePhotoURL(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t ? t.slice(0, 500) : null;
}

function normalizeReplyText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.length > 500) return t.slice(0, 500);
  return t;
}

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────

async function getCaller(req: NextRequest): Promise<{ uid: string; email: string } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAuthAdmin().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || "" };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// AGGREGATE RECOMPUTE
// ─────────────────────────────────────────────────────────

/**
 * Recompute listing ratingAvg / ratingCount from the reviews collection.
 */
async function recomputeListingAggregates(
  adminDb: FirebaseFirestore.Firestore,
  targetId: string,
  targetType: TargetType
): Promise<void> {
  const snap = await adminDb
    .collection("reviews")
    .where("targetId", "==", targetId)
    .get();

  const list = snap.docs.map((d) => d.data() as { rating?: number });
  const count = list.length;
  const ref = adminDb.collection(collectionFor(targetType)).doc(targetId);

  if (count === 0) {
    await ref.update({ ratingAvg: 0, ratingCount: 0 });
    return;
  }

  const sum = list.reduce((acc, r) => acc + normalizeRating(r.rating), 0);
  const avg = Math.round((sum / count) * 10) / 10;
  await ref.update({ ratingAvg: avg, ratingCount: count });
}

/**
 * Recompute provider aggregates across ALL their services + products.
 */
async function recomputeProviderAggregates(
  adminDb: FirebaseFirestore.Firestore,
  providerId: string
): Promise<void> {
  if (!providerId) return;

  const [servicesSnap, productsSnap] = await Promise.all([
    adminDb.collection("services").where("ownerId", "==", providerId).get(),
    adminDb.collection("products").where("ownerId", "==", providerId).get(),
  ]);

  let weightedSum = 0;
  let totalCount = 0;

  for (const snap of [servicesSnap, productsSnap]) {
    for (const d of snap.docs) {
      const data = d.data() as { ratingAvg?: number; ratingCount?: number };
      const cnt = data.ratingCount ?? 0;
      const avg = data.ratingAvg ?? 0;
      if (cnt > 0) {
        weightedSum += avg * cnt;
        totalCount += cnt;
      }
    }
  }

  const userRef = adminDb.collection("users").doc(providerId);

  if (totalCount === 0) {
    await userRef.update({ providerRatingAvg: 0, providerRatingCount: 0 });
    return;
  }

  const providerAvg = Math.round((weightedSum / totalCount) * 10) / 10;
  await userRef.update({
    providerRatingAvg: providerAvg,
    providerRatingCount: totalCount,
  });
}

// ─────────────────────────────────────────────────────────
// ACTION HANDLERS
// ─────────────────────────────────────────────────────────

async function handleUpsert(
  adminDb: FirebaseFirestore.Firestore,
  caller: { uid: string; email: string },
  body: Record<string, unknown>
): Promise<NextResponse> {
  const targetType = body.targetType as string;
  if (!ALLOWED_TARGET_TYPES.includes(targetType as TargetType)) {
    return NextResponse.json({ error: "Invalid targetType." }, { status: 400 });
  }
  const tType = targetType as TargetType;

  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  if (!targetId || targetId.length > 100) {
    return NextResponse.json({ error: "Invalid targetId." }, { status: 400 });
  }

  const rating = normalizeRating(body.rating);
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }
  const text = normalizeText(body.text);
  const authorName = normalizeName(body.authorName);
  const authorPhotoURL = normalizePhotoURL(body.authorPhotoURL);

  // ── Verified gate: require a whatsappClicks record ──
  const clickId = `${caller.uid}_${targetId}`;
  const clickSnap = await adminDb.collection("whatsappClicks").doc(clickId).get();
  if (!clickSnap.exists) {
    return NextResponse.json(
      { error: "Only users who contacted this listing on WhatsApp can review." },
      { status: 403 }
    );
  }

  // ── Look up the listing to get targetOwnerId + validate existence ──
  const listingRef = adminDb.collection(collectionFor(tType)).doc(targetId);
  const listingSnap = await listingRef.get();
  if (!listingSnap.exists) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  const listingData = listingSnap.data() as { ownerId?: string };
  const targetOwnerId = listingData.ownerId || "";
  if (!targetOwnerId) {
    return NextResponse.json({ error: "Listing has no owner." }, { status: 500 });
  }

  // ── Prevent self-review ──
  if (targetOwnerId === caller.uid) {
    return NextResponse.json(
      { error: "You cannot review your own listing." },
      { status: 403 }
    );
  }

  const reviewId = `${caller.uid}_${targetId}`;
  const reviewRef = adminDb.collection("reviews").doc(reviewId);
  const existing = await reviewRef.get();
  const now = Date.now();

  if (existing.exists) {
    // Preserve createdAt, verified, targetOwnerId — only mutable fields change
    await reviewRef.update({
      rating,
      text: text ?? null,
      updatedAt: now,
      authorName: authorName ?? null,
      authorPhotoURL: authorPhotoURL ?? null,
    });
  } else {
    await reviewRef.set({
      targetType: tType,
      targetId,
      targetOwnerId,
      authorId: caller.uid,
      rating,
      text,
      createdAt: now,
      updatedAt: now,
      verified: true,
      authorName,
      authorPhotoURL,
    });
  }

  // ── Recompute both aggregates ──
  await recomputeListingAggregates(adminDb, targetId, tType);
  await recomputeProviderAggregates(adminDb, targetOwnerId);

  return NextResponse.json({ success: true, reviewId });
}

async function handleDelete(
  adminDb: FirebaseFirestore.Firestore,
  caller: { uid: string; email: string },
  body: Record<string, unknown>
): Promise<NextResponse> {
  const reviewId = typeof body.reviewId === "string" ? body.reviewId : "";
  if (!reviewId) {
    return NextResponse.json({ error: "Missing reviewId." }, { status: 400 });
  }

  const reviewRef = adminDb.collection("reviews").doc(reviewId);
  const snap = await reviewRef.get();
  if (!snap.exists) {
    return NextResponse.json({ success: true }); // already gone
  }
  const data = snap.data() as {
    authorId?: string;
    targetId?: string;
    targetType?: TargetType;
    targetOwnerId?: string;
  };

  const isAuthor = data.authorId === caller.uid;
  const isListingOwner = data.targetOwnerId === caller.uid;
  const isAdmin = caller.email === ADMIN_EMAIL;

  if (!isAuthor && !isListingOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await reviewRef.delete();

  if (data.targetId && data.targetType && ALLOWED_TARGET_TYPES.includes(data.targetType)) {
    await recomputeListingAggregates(adminDb, data.targetId, data.targetType);
  }
  if (data.targetOwnerId) {
    await recomputeProviderAggregates(adminDb, data.targetOwnerId);
  }

  return NextResponse.json({ success: true });
}

async function handleReply(
  adminDb: FirebaseFirestore.Firestore,
  caller: { uid: string; email: string },
  body: Record<string, unknown>
): Promise<NextResponse> {
  const reviewId = typeof body.reviewId === "string" ? body.reviewId : "";
  if (!reviewId) {
    return NextResponse.json({ error: "Missing reviewId." }, { status: 400 });
  }
  const text = normalizeReplyText(body.text);
  if (!text) {
    return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
  }

  const reviewRef = adminDb.collection("reviews").doc(reviewId);
  const snap = await reviewRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  const data = snap.data() as { targetOwnerId?: string };
  const isListingOwner = data.targetOwnerId === caller.uid;
  const isAdmin = caller.email === ADMIN_EMAIL;

  if (!isListingOwner && !isAdmin) {
    return NextResponse.json({ error: "Only the listing owner can reply." }, { status: 403 });
  }

  await reviewRef.update({
    reply: { text, createdAt: Date.now() },
  });

  return NextResponse.json({ success: true });
}

async function handleDeleteReply(
  adminDb: FirebaseFirestore.Firestore,
  caller: { uid: string; email: string },
  body: Record<string, unknown>
): Promise<NextResponse> {
  const reviewId = typeof body.reviewId === "string" ? body.reviewId : "";
  if (!reviewId) {
    return NextResponse.json({ error: "Missing reviewId." }, { status: 400 });
  }

  const reviewRef = adminDb.collection("reviews").doc(reviewId);
  const snap = await reviewRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  const data = snap.data() as { targetOwnerId?: string };
  const isListingOwner = data.targetOwnerId === caller.uid;
  const isAdmin = caller.email === ADMIN_EMAIL;

  if (!isListingOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await reviewRef.update({ reply: FieldValue.delete() });

  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────
// ENTRYPOINT
// ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const action = typeof body.action === "string" ? body.action : "";
    const adminDb = getFirestoreDb();

    switch (action) {
      case "upsert":
        return await handleUpsert(adminDb, caller, body);
      case "delete":
        return await handleDelete(adminDb, caller, body);
      case "reply":
        return await handleReply(adminDb, caller, body);
      case "delete_reply":
        return await handleDeleteReply(adminDb, caller, body);
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("reviews API error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}