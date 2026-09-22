// src/services/reviewService.ts
//
// Reviews & ratings — reads via client SDK, writes via /api/reviews.
// Collection: reviews
// Doc ID:     {authorId}_{targetId}   (one review per user per listing)
//
// Why writes go through an API route:
//   - Verified gate requires checking whatsappClicks (server can trust it).
//   - Aggregate caches on listings + user doc require cross-user writes,
//     which Firestore rules block on the client.
//
// Isolation: standalone.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
  Review,
  ReviewTargetKind,
  RatingBreakdown,
  buildReviewId,
  normalizeRating,
  emptyBreakdown,
} from "@/types/review";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

const reviewsRef = collection(db, "reviews");

// ─────────────────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────────────────

async function authHeader(): Promise<HeadersInit> {
  const current = auth.currentUser;
  if (!current) throw new Error("You must be signed in.");
  const token = await current.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function postReview(body: Record<string, unknown>): Promise<void> {
  const headers = await authHeader();
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = "Request failed.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}

// ─────────────────────────────────────────────────────────
// VERIFIED GATE (read-only check for UI)
// ─────────────────────────────────────────────────────────

/**
 * Did this user click WhatsApp on this listing?
 * Mirrors the server-side gate — used to gate the "Write a review" button.
 */
export async function hasClickedWhatsApp(
  authorId: string,
  targetId: string
): Promise<boolean> {
  if (!authorId || !targetId) return false;
  try {
    const clickId = `${authorId}_${targetId}`;
    const snap = await withRetry(
      () => getDoc(doc(db, "whatsappClicks", clickId)),
      { shouldRetry: shouldRetryRead }
    );
    return snap.exists();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// READ HELPERS
// ─────────────────────────────────────────────────────────

export async function getReviewsForListing(
  targetId: string
): Promise<Review[]> {
  if (!targetId) return [];
  try {
    const q = query(
      reviewsRef,
      where("targetId", "==", targetId),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  } catch (error) {
    console.error("Failed to fetch reviews (after retries):", error);
    return [];
  }
}

export async function getUserReview(
  authorId: string,
  targetId: string
): Promise<Review | null> {
  if (!authorId || !targetId) return null;
  try {
    const id = buildReviewId(authorId, targetId);
    const snap = await withRetry(
      () => getDoc(doc(db, "reviews", id)),
      { shouldRetry: shouldRetryRead }
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Review;
  } catch (error) {
    console.error("Failed to fetch user review (after retries):", error);
    return null;
  }
}

export async function hasUserReviewed(
  authorId: string,
  targetId: string
): Promise<boolean> {
  const r = await getUserReview(authorId, targetId);
  return r !== null;
}

export async function getRatingBreakdown(
  targetId: string
): Promise<RatingBreakdown> {
  const list = await getReviewsForListing(targetId);
  const out = emptyBreakdown();
  for (const r of list) {
    const k = normalizeRating(r.rating) as 1 | 2 | 3 | 4 | 5;
    out[k] += 1;
  }
  return out;
}

// ─────────────────────────────────────────────────────────
// WRITES — all go through /api/reviews
// ─────────────────────────────────────────────────────────

interface UpsertReviewParams {
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  targetType: ReviewTargetKind;
  targetId: string;
  targetOwnerId: string;
  rating: number;
  text?: string;
}

/**
 * Create or edit a review.
 * Server verifies the WhatsApp-click gate + recomputes aggregates.
 */
export async function createOrUpdateReview(
  params: UpsertReviewParams
): Promise<void> {
  await postReview({
    action: "upsert",
    targetType: params.targetType,
    targetId: params.targetId,
    rating: params.rating,
    text: params.text ?? null,
    authorName: params.authorName ?? null,
    authorPhotoURL: params.authorPhotoURL ?? null,
  });
}

/**
 * Delete a review. Author, listing owner, or admin (checked server-side).
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await postReview({ action: "delete", reviewId });
}

/**
 * Owner adds (or replaces) their one reply.
 */
export async function addReply(
  reviewId: string,
  text: string
): Promise<void> {
  await postReview({ action: "reply", reviewId, text });
}

/**
 * Owner removes their reply.
 */
export async function deleteReply(reviewId: string): Promise<void> {
  await postReview({ action: "delete_reply", reviewId });
}