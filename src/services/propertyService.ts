import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Property, VerificationStatus } from "@/types/property";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

function getPropertiesRef() {
  if (!db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, "properties");
}

/**
 * Add a new property – sets verificationStatus to "pending" automatically,
 * and adds createdAt/updatedAt timestamps.
 *
 * ⚠️ Not retried — writes must not run twice.
 */
export async function addProperty(data: Omit<Property, "id">): Promise<string> {
  try {
    const propertiesRef = getPropertiesRef();
    const propertyData = {
      ...data,
      verificationStatus: "pending" as VerificationStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const docRef = await addDoc(propertiesRef, propertyData);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add property:", error);
    throw error;
  }
}

/**
 * Get all properties – for public use. Only returns approved properties.
 *
 * ⚡ Network-resilient: 3 attempts × 15s timeout each with exponential backoff.
 */
export async function getAllProperties(): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();
    const q = query(propertiesRef, where("verificationStatus", "==", "approved"));

    const snapshot = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Property));
  } catch (error) {
    console.error("Failed to fetch properties (after retries):", error);
    return [];
  }
}

/**
 * Get a single property by ID (no filtering – returns any status).
 *
 * ⚡ Network-resilient: 3 attempts × 15s timeout.
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  if (!db) return null;
  try {
    const snapshot = await withRetry(
      () => getDoc(doc(db, "properties", id)),
      { shouldRetry: shouldRetryRead }
    );

    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Property;
  } catch (error) {
    console.error(`Failed to fetch property ${id} (after retries):`, error);
    return null;
  }
}

/**
 * Get all properties owned by a specific landlord – returns all statuses.
 *
 * ⚡ Network-resilient: 3 attempts × 15s timeout.
 */
export async function getPropertiesByOwner(ownerId: string): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();
    const q = query(propertiesRef, where("ownerId", "==", ownerId));

    const snapshot = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Property));
  } catch (error) {
    console.error(`Failed to fetch properties for owner ${ownerId} (after retries):`, error);
    return [];
  }
}

/**
 * Get properties near the same university, for "related listings" sidebars.
 *
 * - Excludes a specific ID (the current listing being viewed).
 * - Only returns approved, active, non-hidden properties.
 * - Prioritizes boosted, then properties with available beds, then newest.
 * - ⚡ Network-resilient: 3 attempts × 15s timeout.
 *
 * @param universityId  Same campus filter
 * @param excludeId     The current property's ID (won't be returned)
 * @param limit         Max items to return (default 8)
 */
export async function getPropertiesByUniversity(
  universityId: string,
  excludeId: string,
  limit = 8
): Promise<Property[]> {
  if (!universityId || !db) return [];
  try {
    const propertiesRef = getPropertiesRef();
    const q = query(propertiesRef, where("universityId", "==", universityId));

    const snapshot = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );

    const all = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Property))
      .filter((p) => {
        if (p.id === excludeId) return false;
        if (p.adminHidden) return false;
        if (p.isActive === false) return false;
        if (p.verificationStatus !== "approved") return false;
        return true;
      });

    // Sort: boosted first, then properties with available beds, then newest
    const sorted = all.sort((a, b) => {
      const aBoosted = a.isBoosted ? 1 : 0;
      const bBoosted = b.isBoosted ? 1 : 0;
      if (aBoosted !== bBoosted) return bBoosted - aBoosted;

      const aAvailable = (a.bedSpaces ?? []).filter((b) => b.isAvailable).length;
      const bAvailable = (b.bedSpaces ?? []).filter((b) => b.isAvailable).length;
      const aHas = aAvailable > 0 ? 1 : 0;
      const bHas = bAvailable > 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;

      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return sorted.slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch properties by university (after retries):", error);
    return [];
  }
}

/**
 * Update a property – automatically updates `updatedAt` timestamp.
 *
 * ⚠️ Not retried — writes must not run twice.
 */
export async function updateProperty(id: string, data: Partial<Property>): Promise<void> {
  if (!db) throw new Error("Firebase is not initialized");
  try {
    await updateDoc(doc(db, "properties", id), {
      ...data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error(`Failed to update property ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a property.
 *
 * ⚠️ Not retried — writes must not run twice.
 */
export async function deleteProperty(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not initialized");
  try {
    await deleteDoc(doc(db, "properties", id));
  } catch (error) {
    console.error(`Failed to delete property ${id}:`, error);
    throw error;
  }
}

// ─── Update bed availability with transaction ───
export async function updateBedAvailability(
  propertyId: string,
  bedSpaceId: string,
  isAvailable: boolean
): Promise<void> {
  const propertyRef = doc(db, "properties", propertyId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(propertyRef);
    if (!snap.exists()) {
      throw new Error("Property not found");
    }
    const data = snap.data();
    const bedSpaces = data.bedSpaces || [];
    const index = bedSpaces.findIndex((b: any) => b.id === bedSpaceId);
    if (index === -1) {
      throw new Error("Bed space not found");
    }
    bedSpaces[index].isAvailable = isAvailable;
    transaction.update(propertyRef, { bedSpaces });
  });
}