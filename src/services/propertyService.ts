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

function getPropertiesRef() {
  if (!db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, "properties");
}

/**
 * Add a new property – sets verificationStatus to "pending" automatically,
 * and adds createdAt/updatedAt timestamps.
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
 */
export async function getAllProperties(): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();
    const q = query(propertiesRef, where("verificationStatus", "==", "approved"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Property));
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return [];
  }
}

/**
 * Get a single property by ID (no filtering – returns any status).
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  if (!db) return null;
  try {
    const snapshot = await getDoc(doc(db, "properties", id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Property;
  } catch (error) {
    console.error(`Failed to fetch property ${id}:`, error);
    return null;
  }
}

/**
 * Get all properties owned by a specific landlord – returns all statuses.
 */
export async function getPropertiesByOwner(ownerId: string): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();
    const q = query(propertiesRef, where("ownerId", "==", ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Property));
  } catch (error) {
    console.error(`Failed to fetch properties for owner ${ownerId}:`, error);
    return [];
  }
}

/**
 * Update a property – automatically updates `updatedAt` timestamp.
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