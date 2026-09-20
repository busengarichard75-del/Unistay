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
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

const servicesRef = collection(db, "services");

/**
 * Create a service.
 * ⚠️ Not retried — writes must not run twice.
 */
export async function addService(data: Omit<Service, "id">): Promise<string> {
  try {
    const docRef = await addDoc(servicesRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add service:", error);
    throw error;
  }
}

/**
 * Get a service by ID.
 * ⚡ Network-resilient: 3 attempts × 15s timeout with exponential backoff.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const snap = await withRetry(
      () => getDoc(doc(db, "services", id)),
      { shouldRetry: shouldRetryRead }
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Service;
  } catch (error) {
    console.error("Failed to fetch service (after retries):", error);
    return null;
  }
}

/**
 * Get all services (newest first).
 * ⚡ Network-resilient: 3 attempts × 15s timeout.
 */
export async function getAllServices(): Promise<Service[]> {
  try {
    const q = query(servicesRef, orderBy("createdAt", "desc"));
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
  } catch (error) {
    console.error("Failed to fetch services (after retries):", error);
    return [];
  }
}

/**
 * Get services owned by a specific provider (newest first).
 * ⚡ Network-resilient: 3 attempts × 15s timeout.
 */
export async function getServicesByOwner(ownerId: string): Promise<Service[]> {
  try {
    const q = query(
      servicesRef,
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
  } catch (error) {
    console.error("Failed to fetch owner services (after retries):", error);
    return [];
  }
}

/**
 * Update a service.
 * ⚠️ Not retried — writes must not run twice.
 */
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

/**
 * Delete a service.
 * ⚠️ Not retried — writes must not run twice.
 */
export async function deleteService(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "services", id));
  } catch (error) {
    console.error("Failed to delete service:", error);
    throw error;
  }
}