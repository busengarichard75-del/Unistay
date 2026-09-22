// src/types/follow.ts
//
// Follow system — one doc per (follower → provider) relationship.
// Collection: follows
// Doc ID:     {followerId}_{providerId}   ← deterministic, prevents duplicates
//
// Isolation: this file is standalone. Deleting the Follow feature means
// deleting this file + followService + FollowButton + the 2 pages. No
// existing page breaks.

export interface Follow {
  id: string;               // `${followerId}_${providerId}`
  followerId: string;       // the user who follows
  providerId: string;       // the provider being followed
  createdAt: number;

  // ─── Denormalized snapshots (avoid extra reads on the followers list) ───
  // Captured at follow-time. Refreshed lazily if stale — mirrors the
  // sellerName/sellerPhotoURL pattern already used on Product.
  followerName?: string;
  followerPhotoURL?: string;
  providerName?: string;
  providerPhotoURL?: string;
}

/**
 * Deterministic doc ID for a follow relationship.
 * Same ID on both follow + unfollow → no accidental duplicates.
 */
export function buildFollowId(followerId: string, providerId: string): string {
  return `${followerId}_${providerId}`;
}

/**
 * True when a user cannot follow a provider (self-follow).
 * Used to hide the Follow button on the user's own profile.
 */
export function isSelfFollow(followerId: string, providerId: string): boolean {
  return followerId === providerId;
}