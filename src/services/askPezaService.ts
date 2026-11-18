// src/services/askPezaService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AskPezaRequest } from "@/types/askPeza";

const requestsRef = collection(db, "wantedRequests");

/**
 * Student creates a new request
 */
export async function createAskPezaRequest(
  data: Omit<AskPezaRequest, "id" | "createdAt" | "status">
): Promise<string> {
  try {
    const docRef = await addDoc(requestsRef, {
      ...data,
      status: "pending",
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Failed to create request:", error);
    throw error;
  }
}

/**
 * Admin fetches all requests (newest first)
 */
export async function getAllAskPezaRequests(): Promise<AskPezaRequest[]> {
  try {
    const q = query(requestsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AskPezaRequest));
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return [];
  }
}

/**
 * Admin updates request status
 */
export async function updateAskPezaRequest(
  id: string,
  data: Partial<AskPezaRequest>
): Promise<void> {
  try {
    await updateDoc(doc(db, "wantedRequests", id), data);
  } catch (error) {
    console.error("Failed to update request:", error);
    throw error;
  }
}