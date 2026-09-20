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

const libraryRef = collection(db, "library");

// ─────────────────────────────────────────────────────────
// CREATE
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
// ─────────────────────────────────────────────────────────
export async function getLibraryEntryById(
  id: string
): Promise<LibraryEntry | null> {
  try {
    const snap = await getDoc(doc(db, "library", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as LibraryEntry;
  } catch (error) {
    console.error("Failed to fetch library entry:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// READ — all public entries
// Includes: approved + not adminHidden
// Excludes: pending, rejected, hidden
// Sorted: newest first
// ─────────────────────────────────────────────────────────
export async function getApprovedLibraryEntries(): Promise<LibraryEntry[]> {
  try {
    const q = query(
      libraryRef,
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as LibraryEntry))
      .filter((e) => !e.adminHidden);
  } catch (error) {
    console.error("Failed to fetch approved library entries:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — by uploader (for "My Uploads")
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
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryEntry));
  } catch (error) {
    console.error("Failed to fetch uploader's library entries:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — pending (for admin moderation)
// ─────────────────────────────────────────────────────────
export async function getPendingLibraryEntries(): Promise<LibraryEntry[]> {
  try {
    const q = query(
      libraryRef,
      where("status", "==", "pending"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryEntry));
  } catch (error) {
    console.error("Failed to fetch pending library entries:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — by category (used on browse page if needed)
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
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as LibraryEntry))
      .filter((e) => !e.adminHidden);
  } catch (error) {
    console.error("Failed to fetch library entries by category:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// UPDATE — partial
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
// ─────────────────────────────────────────────────────────
export async function setLibraryEntryStatus(
  id: string,
  status: LibraryStatus
): Promise<void> {
  return updateLibraryEntry(id, { status, updatedAt: Date.now() });
}

// ─────────────────────────────────────────────────────────
// DELETE — hard delete (owner or admin)
// ─────────────────────────────────────────────────────────
export async function deleteLibraryEntry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "library", id));
  } catch (error) {
    console.error("Failed to delete library entry:", error);
    throw error;
  }
}