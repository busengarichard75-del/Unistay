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
import { Property } from "@/types/property";

function getPropertiesRef() {
  if (!db) {
    throw new Error("Firebase is not initialized");
  }

  return collection(db, "properties");
}

export async function addProperty(
  data: Omit<Property, "id">
): Promise<string> {
  try {
    const propertiesRef = getPropertiesRef();

    const docRef = await addDoc(propertiesRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add property:", error);
    throw error;
  }
}

export async function getAllProperties(): Promise<Property[]> {
  try {
    const propertiesRef = getPropertiesRef();

    const snapshot = await getDocs(propertiesRef);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Property)
    );
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return [];
  }
}

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