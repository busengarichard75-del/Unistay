// src/services/serviceService.ts

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Service } from "@/types/service";

const servicesRef = collection(db, "services");

export async function addService(data: Omit<Service, "id">): Promise<string> {
  try {
    const docRef = await addDoc(servicesRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add service:", error);
    throw error;
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const snap = await getDoc(doc(db, "services", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Service;
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return null;
  }
}

export async function getAllServices(): Promise<Service[]> {
  try {
    const q = query(servicesRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }
}

export async function getServicesByOwner(ownerId: string): Promise<Service[]> {
  try {
    const q = query(
      servicesRef,
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
  } catch (error) {
    console.error("Failed to fetch owner services:", error);
    return [];
  }
}

export async function updateService(
  id: string,
  data: Partial<Service>
): Promise<void> {
  try {
    await updateDoc(doc(db, "services", id), data);
  } catch (error) {
    console.error("Failed to update service:", error);
    throw error;
  }
}

export async function deleteService(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "services", id));
  } catch (error) {
    console.error("Failed to delete service:", error);
    throw error;
  }
}