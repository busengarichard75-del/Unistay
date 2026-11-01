// src/lib/listingLimit.ts
//
// Enforces the per-plan listing cap on the write path. Called from
// addProduct() and addService() so a provider cannot exceed their plan
// by refreshing the page, opening a second tab, or calling the service
// directly.
//
// Counts products + services combined, matching the provider dashboard UI.
//
// CAVEAT: This is a read-then-write check, not an atomic transaction.
// Two simultaneous writes from separate tabs could each see "14" and
// both succeed, ending at 16. That's acceptable for honest-use cases.
// For airtight enforcement, use a Firestore transaction with a
// listingCount field on the user doc — see the project docs.

import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPlanLimit } from "@/lib/plans";

/**
 * Throws if the given owner is at or over their plan's listing limit.
 * Call this immediately before writing a new product or service.
 */
export async function assertUnderListingLimit(ownerId: string): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", ownerId));
  if (!userSnap.exists()) {
    throw new Error(
      "Cannot verify listing limit: user profile not found. Please sign in again."
    );
  }

  const userData = userSnap.data();
  const limit = getPlanLimit(userData?.plan, userData?.planExpiry);

  // Unlimited plan — no cap to enforce.
  if (limit === Infinity) return;

  const [productsSnap, servicesSnap] = await Promise.all([
    getDocs(query(collection(db, "products"), where("ownerId", "==", ownerId))),
    getDocs(query(collection(db, "services"), where("ownerId", "==", ownerId))),
  ]);

  const total = productsSnap.size + servicesSnap.size;

  if (total >= limit) {
    throw new Error(
      `Listing limit reached (${total}/${limit}). Upgrade your plan to add more listings.`
    );
  }
}