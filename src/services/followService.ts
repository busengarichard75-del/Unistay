// src/services/followService.ts
//
// Follow system — client SDK, direct Firestore writes.
// Collection: follows
// Doc ID:     {followerId}_{providerId}   (deterministic → idempotent)
//
// Design note (v1 — safest):
//   - No counter cache on the user doc (avoids cross-user rule hole).
//   - Follower count is computed on-read via getCountFromServer.
//   - All writes go through Firestore rules; no API route needed.
//
// Isolation: standalone.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Follow, buildFollowId } from "@/types/follow";
import { stripUndefined } from "@/lib/stripUndefined";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

const followsRef = collection(db, "follows");

/**
 * Follow a provider.
 * Writes follows/{followerId}_{providerId}. Idempotent (merge).
 * ⚠️ Not retried — writes must not run twice.
 */
export async function followProvider(params: {
  followerId: string;
  providerId: string;
  followerName?: string;
  followerPhotoURL?: string;
  providerName?: string;
  providerPhotoURL?: string;
}): Promise<void> {
  const {
    followerId,
    providerId,
    followerName,
    followerPhotoURL,
    providerName,
    providerPhotoURL,
  } = params;

  if (!followerId || !providerId) throw new Error("Missing follow ids");
  if (followerId === providerId) throw new Error("Cannot follow yourself");

  const followId = buildFollowId(followerId, providerId);
  const followRef = doc(db, "follows", followId);

  // Build the payload, then strip `undefined` — Firestore rejects undefined.
  const rawPayload: Record<string, any> = {
    followerId,
    providerId,
    createdAt: Date.now(),
    followerName,
    followerPhotoURL,
    providerName,
    providerPhotoURL,
  };
  const payload = stripUndefined(rawPayload);

  try {
    await setDoc(followRef, payload, { merge: true });
  } catch (error) {
    console.error("Failed to follow provider:", error);
    throw error;
  }
}

/**
 * Unfollow a provider.
 * Deletes follows/{followerId}_{providerId}. Idempotent.
 * ⚠️ Not retried — writes must not run twice.
 */
export async function unfollowProvider(
  followerId: string,
  providerId: string
): Promise<void> {
  if (!followerId || !providerId) throw new Error("Missing follow ids");

  const followId = buildFollowId(followerId, providerId);
  const followRef = doc(db, "follows", followId);

  try {
    await deleteDoc(followRef);
  } catch (error) {
    console.error("Failed to unfollow provider:", error);
    throw error;
  }
}

/**
 * Is `followerId` currently following `providerId`?
 * ⚡ Network-resilient (single-doc read).
 */
export async function isFollowing(
  followerId: string,
  providerId: string
): Promise<boolean> {
  if (!followerId || !providerId) return false;
  try {
    const followId = buildFollowId(followerId, providerId);
    const snap = await withRetry(
      () => getDoc(doc(db, "follows", followId)),
      { shouldRetry: shouldRetryRead }
    );
    return snap.exists();
  } catch (error) {
    console.error("Failed to check follow state (after retries):", error);
    return false;
  }
}

/**
 * Real-time listener for a single follow relationship.
 * Used by FollowButton so both the icon and count stay in sync across tabs.
 * Returns the unsubscribe function.
 */
export function subscribeToFollow(
  followerId: string,
  providerId: string,
  callback: (following: boolean) => void
): () => void {
  if (!followerId || !providerId) {
    callback(false);
    return () => {};
  }
  const followId = buildFollowId(followerId, providerId);
  return onSnapshot(
    doc(db, "follows", followId),
    (snap) => callback(snap.exists()),
    () => callback(false)
  );
}

/**
 * Get all followers of a provider (newest first).
 * ⚡ Network-resilient.
 */
export async function getFollowers(providerId: string): Promise<Follow[]> {
  if (!providerId) return [];
  try {
    const q = query(
      followsRef,
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Follow));
  } catch (error) {
    console.error("Failed to fetch followers (after retries):", error);
    return [];
  }
}

/**
 * Get all providers a user follows (newest first).
 * ⚡ Network-resilient.
 */
export async function getFollowing(followerId: string): Promise<Follow[]> {
  if (!followerId) return [];
  try {
    const q = query(
      followsRef,
      where("followerId", "==", followerId),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Follow));
  } catch (error) {
    console.error("Failed to fetch following (after retries):", error);
    return [];
  }
}

/**
 * Just the provider IDs a user follows — for filtering the Following feed.
 * ⚡ Network-resilient.
 */
export async function getFollowingProviderIds(
  followerId: string
): Promise<string[]> {
  const follows = await getFollowing(followerId);
  return follows.map((f) => f.providerId);
}

/**
 * Count followers for a provider.
 * Uses getCountFromServer — no cache, no cross-user writes, always accurate.
 * ⚡ Network-resilient (single aggregation query).
 */
export async function getFollowerCount(providerId: string): Promise<number> {
  if (!providerId) return 0;
  try {
    const q = query(followsRef, where("providerId", "==", providerId));
    const snap = await withRetry(
      () => getCountFromServer(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.data().count;
  } catch (error) {
    console.error("Failed to count followers (after retries):", error);
    return 0;
  }
}