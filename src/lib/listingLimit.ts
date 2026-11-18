// src/lib/listingLimit.ts
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPlanLimit } from "@/lib/plans";
import { getServicePlanLimit } from "@/lib/servicePlans";

/**
 * Enforces the standard plan listing cap (Products + Properties).
 */
export async function assertUnderListingLimit(ownerId: string): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", ownerId));
  if (!userSnap.exists()) throw new Error("Cannot verify listing limit: user profile not found.");
  
  const userData = userSnap.data();
  const limit = getPlanLimit(userData?.plan, userData?.planExpiry);

  if (limit === Infinity) return;

  const [productsSnap, servicesSnap] = await Promise.all([
    getDocs(query(collection(db, "products"), where("ownerId", "==", ownerId))),
    getDocs(query(collection(db, "services"), where("ownerId", "==", ownerId))),
  ]);

  const total = productsSnap.size + servicesSnap.size;

  if (total >= limit) {
    throw new Error(`Listing limit reached (${total}/${limit}). Upgrade your plan to add more listings.`);
  }
}

/**
 * ⭐ STRICT LIMIT: Enforces Service limits based on the dedicated Service Plan.
 */
export async function assertUnderServiceLimit(ownerId: string): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", ownerId));
  if (!userSnap.exists()) throw new Error("Cannot verify service limit: user profile not found.");

  const userData = userSnap.data();
  const limit = getServicePlanLimit(userData?.servicePlan, userData?.servicePlanExpiry);

  if (limit === Infinity) return;

  const servicesRef = collection(db, "services");
  const q = query(servicesRef, where("ownerId", "==", ownerId));
  const snap = await getDocs(q);

  if (snap.size >= limit) {
    throw new Error(
      `You have reached your limit of ${limit} service listing(s). To add another, please upgrade your Service Shop or delete an existing listing.`
    );
  }
}