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
 * Add a new property – sets verificationStatus to "pending" automatically.
 */
export async function addProperty(
  data: Omit<Property, "id">
): Promise<string> {
  try {
    const propertiesRef = getPropertiesRef();

    // ✅ NEW: Set verificationStatus to "pending" for new listings
    const propertyData = {
      ...data,
      verificationStatus: "pending" as VerificationStatus,
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
 * ⚠️ Before using this, backfill existing properties to "approved".
 */
export async function getAllProperties(): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();

    // ✅ NEW: Only fetch properties that are approved
    const q = query(
      propertiesRef,
      where("verificationStatus", "==", "approved")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Property)
    );
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return [];
  }
}

/**
 * Get a single property by ID (no filtering – returns any status).
 */
export async function getPropertyById(
  id: string
): Promise<Property | null> {
  if (!db) {
    return null;
  }

  try {
    const snapshot = await getDoc(
      doc(db, "properties", id)
    );

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Property;

  } catch (error) {
    console.error(`Failed to fetch property ${id}:`, error);
    return null;
  }
}

/**
 * Get all properties owned by a specific landlord – returns all statuses.
 * Used in the landlord dashboard.
 */
export async function getPropertiesByOwner(
  ownerId: string
): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();

    const q = query(
      propertiesRef,
      where("ownerId", "==", ownerId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Property)
    );

  } catch (error) {
    console.error(
      `Failed to fetch properties for owner ${ownerId}:`,
      error
    );

    return [];
  }
}

/**
 * Update a property (admin can update verificationStatus, landlords can update other fields).
 */
export async function updateProperty(
  id: string,
  data: Partial<Property>
): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized");
  }

  try {
    await updateDoc(
      doc(db, "properties", id),
      data
    );

  } catch (error) {
    console.error(
      `Failed to update property ${id}:`,
      error
    );

    throw error;
  }
}

export async function deleteProperty(
  id: string
): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized");
  }

  try {
    await deleteDoc(
      doc(db, "properties", id)
    );

  } catch (error) {
    console.error(
      `Failed to delete property ${id}:`,
      error
    );

    throw error;
  }
}