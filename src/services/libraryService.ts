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
import {
  LibraryEntry,
  LibraryEntryPublic,
  LibraryStatus,
  LibraryUnlock,
} from "@/types/library";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

const libraryRef = collection(db, "library");

// ─────────────────────────────────────────────────────────
// CREATE — public entry (no driveLink; driveLink lives in libraryPrivate)
// ⚠️ Not retried — writes must not run twice.
// ─────────────────────────────────────────────────────────
export async function addLibraryEntry(
  data: Omit<LibraryEntryPublic, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(libraryRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add library entry:", error);
    throw error;
  }
}

/**
 * Save the Google Drive link into the private `libraryPrivate` collection.
 * Client SDK write — the Firestore rule allows it only when:
 *   - the caller is the uploader of the corresponding library entry, AND
 *   - the library entry's status is still "pending"
 */
export async function saveLibraryPrivateLink(
  entryId: string,
  driveLink: string
): Promise<void> {
  try {
    await updateDoc(doc(db, "libraryPrivate", entryId), { driveLink }).catch(
      async () => {
        // updateDoc fails if doc doesn't exist — fall back to setDoc
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "libraryPrivate", entryId), {
          driveLink,
          updatedAt: Date.now(),
        });
      }
    );
  } catch (error) {
    console.error("Failed to save private drive link:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// READ — single (public fields only; driveLink NOT included)
// ─────────────────────────────────────────────────────────
export async function getLibraryEntryById(
  id: string
): Promise<LibraryEntryPublic | null> {
  try {
    const snap = await withRetry(
      () => getDoc(doc(db, "library", id)),
      { shouldRetry: shouldRetryRead }
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as LibraryEntryPublic;
  } catch (error) {
    console.error("Failed to fetch library entry (after retries):", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// READ — all public entries
// ─────────────────────────────────────────────────────────
export async function getApprovedLibraryEntries(): Promise<LibraryEntryPublic[]> {
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
      .map((d) => ({ id: d.id, ...d.data() } as LibraryEntryPublic))
      .filter((e) => !e.adminHidden);
  } catch (error) {
    console.error("Failed to fetch approved library entries (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — by uploader (for "My Uploads")
// ─────────────────────────────────────────────────────────
export async function getLibraryEntriesByUploader(
  uploaderId: string
): Promise<LibraryEntryPublic[]> {
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryEntryPublic));
  } catch (error) {
    console.error("Failed to fetch uploader's library entries (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — pending (for admin moderation)
// ─────────────────────────────────────────────────────────
export async function getPendingLibraryEntries(): Promise<LibraryEntryPublic[]> {
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryEntryPublic));
  } catch (error) {
    console.error("Failed to fetch pending library entries (after retries):", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// READ — by category
// ─────────────────────────────────────────────────────────
export async function getApprovedLibraryEntriesByCategory(
  category: string
): Promise<LibraryEntryPublic[]> {
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
      .map((d) => ({ id: d.id, ...d.data() } as LibraryEntryPublic))
      .filter((e) => !e.adminHidden);
  } catch (error) {
    console.error("Failed to fetch library entries by category (after retries):", error);
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

// ─────────────────────────────────────────────────────────
// UNLOCK SYSTEM — direct Firestore client calls, no API routes.
// Firestore rules enforce everything (who can read libraryPrivate,
// who can create libraryUnlocks, etc.). See firestore.rules.
// ─────────────────────────────────────────────────────────

/**
 * Check if the current user has unlocked a given library entry.
 * Reads libraryUnlocks/{uid}_{entryId} — rules allow the user to read
 * only their own unlock records.
 */
export async function checkUnlockState(
  uid: string,
  entryId: string
): Promise<boolean> {
  if (!uid || !entryId) return false;
  try {
    const unlockId = `${uid}_${entryId}`;
    const snap = await getDoc(doc(db, "libraryUnlocks", unlockId));
    return snap.exists();
  } catch (error) {
    console.error("Failed to check unlock state:", error);
    return false;
  }
}

/**
 * Record that the user completed a challenge for this entry.
 * Firestore rules verify: caller == userId, entryId is a string,
 * challenge is either "share" or "follow", and doc ID matches pattern.
 */
export async function unlockMaterial(
  uid: string,
  entryId: string,
  challenge: "share" | "follow"
): Promise<void> {
  try {
    const unlockId = `${uid}_${entryId}`;
    const { setDoc } = await import("firebase/firestore");
    const payload: Omit<LibraryUnlock, "completedAt"> & { completedAt: number } = {
      userId: uid,
      entryId,
      challenge,
      completedAt: Date.now(),
    };
    await setDoc(doc(db, "libraryUnlocks", unlockId), payload);
  } catch (error) {
    console.error("Failed to record unlock:", error);
    throw error;
  }
}

/**
 * Fetch the private Google Drive link for a library entry.
 * Firestore rules allow the read only if the caller is the uploader
 * OR has an unlock record. Returns null otherwise.
 */
export async function getPrivateDriveLink(
  entryId: string
): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "libraryPrivate", entryId));
    if (!snap.exists()) return null;
    const data = snap.data() as { driveLink?: string };
    return typeof data.driveLink === "string" ? data.driveLink : null;
  } catch (error) {
    console.error("Failed to fetch private drive link:", error);
    return null;
  }
}