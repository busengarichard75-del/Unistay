// src/types/review.ts
//
// Reviews & ratings — services + products only (NOT properties/library in v1).
// Collection: reviews
// Doc ID:     auto-generated
//
// Isolation: standalone. Deleting the Reviews feature = delete this file +
// reviewService + the 4 review components + the ReviewSection mount in the
// 2 detail pages. No existing page breaks.

export type ReviewTargetKind = "service" | "product";

export interface Review {
  id: string;
  targetType: ReviewTargetKind;
  targetId: string;         // service.id or product.id
  targetOwnerId: string;    // provider/seller uid — used for aggregate recompute

  authorId: string;         // reviewer uid
  rating: number;           // 1..5 (integer)
  text?: string;            // optional
  createdAt: number;
  updatedAt: number;

  // ─── Verified gate ───
  // true only when the author had a whatsappClicks/{uid}_{listingId} record.
  // Enforced at write time (server or rules). Immutable after create.
  verified: boolean;

  // ─── Owner reply (one per review) ───
  reply?: ReviewReply;

  // ─── Denormalized author snapshot (avoids extra reads on the list) ───
  // Mirrors the sellerName/sellerPhotoURL pattern already used on Product.
  authorName?: string;
  authorPhotoURL?: string;
}

export interface ReviewReply {
  text: string;
  createdAt: number;
}

export type RatingBreakdown = {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
};

/**
 * Deterministic doc ID for a review.
 * One review per user per listing → enforced by doc ID, no query needed.
 * If we later allow multiple reviews this changes, but for v1 it's simplest.
 */
export function buildReviewId(authorId: string, targetId: string): string {
  return `${authorId}_${targetId}`;
}

/**
 * Clamp + round a rating to a valid 1..5 integer.
 * Guards against any UI bypass.
 */
export function normalizeRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const n = Math.round(value);
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

/**
 * Human-readable "X.Y" string for display. Returns "—" when count is 0
 * so callers can decide whether to hide the row entirely.
 */
export function formatRating(avg: number | undefined, count: number | undefined): string {
  if (!count || count <= 0 || avg === undefined) return "—";
  return avg.toFixed(1);
}

/**
 * Trim review text safely. Empty → undefined so we don't store "" strings.
 */
export function normalizeReviewText(raw: string | undefined): string | undefined {
  const t = (raw ?? "").trim();
  return t.length > 0 ? t.slice(0, 1000) : undefined;
}

/**
 * Empty breakdown — used as initial state on detail pages.
 */
export function emptyBreakdown(): RatingBreakdown {
  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
}