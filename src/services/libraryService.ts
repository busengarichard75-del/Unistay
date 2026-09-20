// src/services/libraryService.ts

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
import { LibraryEntry, LibraryStatus } from "@/types/library";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

const libraryRef = collection(db, "library");

// ─────────────────────────────────────────────────────────
// CREATE
// ⚠️ Not retried — writes must not run twice.
// ─────────────────────────────────────────────────────────
export async function addLibraryEntry(
  data: Omit<LibraryEntry, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(libraryRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add library entry:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// READ — single
// ⚡ Network-resilient: 3 attempts × 15s timeout
// ─────────────────────────────────────────────────────────
export async function getLibraryEntryById(
  id: string
): Promise<LibraryEntry | null> {
  try {
    const snap = await withRetry(
      () => getDoc(doc(db, "library", id)),
      { shouldRetry: shouldRetryRead }
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as LibraryEntry;
  } catch (error) {
    console.error("Failed to fetch library entry (after retries):", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// READ — all public entries
// Includes: approved + not adminHidden
// Excludes: pending, rejected, hidden
// Sorted: newest first
// ⚡ Network-resilient: 3 attempts × 15s timeout
// ─────────────────────────────────────────────────────────
export async function getApprovedLibraryEntries(): Promise<LibraryEntry[]> {
  try {
    const q = query(
      libraryRef,
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as LibraryEntry))
      .filter((e) => !e.adminHidden);
  } catch (error) {
    console.error("Failed to fetch approved library entries (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — by uploader (for "My Uploads")
// ⚡ Network-resilient: 3 attempts × 15s timeout
// ─────────────────────────────────────────────────────────
export async function getLibraryEntriesByUploader(
  uploaderId: string
): Promise<LibraryEntry[]> {
  try {
    const q = query(
      libraryRef,
      where("uploaderId", "==", uploaderId),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryEntry));
  } catch (error) {
    console.error("Failed to fetch uploader's library entries (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — pending (for admin moderation)
// ⚡ Network-resilient: 3 attempts × 15s timeout
// ─────────────────────────────────────────────────────────
export async function getPendingLibraryEntries(): Promise<LibraryEntry[]> {
  try {
    const q = query(
      libraryRef,
      where("status", "==", "pending"),
      orderBy("createdAt", "asc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryEntry));
  } catch (error) {
    console.error("Failed to fetch pending library entries (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — by category (used on browse page if needed)
// ⚡ Network-resilient: 3 attempts × 15s timeout
// ─────────────────────────────────────────────────────────
export async function getApprovedLibraryEntriesByCategory(
  category: string
): Promise<LibraryEntry[]> {
  try {
    const q = query(
      libraryRef,
      where("status", "==", "approved"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as LibraryEntry))
      .filter((e) => !e.adminHidden);
  } catch (error) {
    console.error("Failed to fetch library entries by category (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// UPDATE — partial
// ⚠️ Not retried — writes must not run twice.
// ─────────────────────────────────────────────────────────
export async function updateLibraryEntry(
  id: string,
  data: Partial<LibraryEntry>
): Promise<void> {
  try {
    await updateDoc(doc(db, "library", id), data);
  } catch (error) {
    console.error("Failed to update library entry:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// UPDATE — status shortcut (admin approval workflow)
// ⚠️ Not retried — delegates to updateLibraryEntry.
// ─────────────────────────────────────────────────────────
export async function setLibraryEntryStatus(
  id: string,
  status: LibraryStatus
): Promise<void> {
  return updateLibraryEntry(id, { status, updatedAt: Date.now() });
}

// ─────────────────────────────────────────────────────────
// DELETE — hard delete (owner or admin)
// ⚠️ Not retried — writes must not run twice.
// ─────────────────────────────────────────────────────────
export async function deleteLibraryEntry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "library", id));
  } catch (error) {
    console.error("Failed to delete library entry:", error);
    throw error;
  }
}