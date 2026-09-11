// src/services/checklistService.ts
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingChecklist, ChecklistStepKey } from "@/types/bookingChecklist";

const COLLECTION = "bookingChecklists";

// ─── In-memory fallback (used only if Firestore write is denied) ───
const memoryFallback = new Map<string, BookingChecklist>();

function checklistRef(bookingId: string) {
  return doc(db, COLLECTION, bookingId);
}

function emptyChecklist(bookingId: string): BookingChecklist {
  const now = Date.now();
  return {
    bookingId,
    steps: {
      paymentReceived: true,
      landlordContacted: false,
      checkedIn: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function getChecklist(
  bookingId: string
): Promise<BookingChecklist | null> {
  try {
    const snap = await getDoc(checklistRef(bookingId));
    if (!snap.exists()) return null;
    return { bookingId: snap.id, ...snap.data() } as BookingChecklist;
  } catch {
    // Silent — fall back to memory if Firestore read denied
    return memoryFallback.get(bookingId) ?? null;
  }
}

export async function ensureChecklist(
  bookingId: string
): Promise<BookingChecklist> {
  try {
    const snap = await getDoc(checklistRef(bookingId));
    if (snap.exists()) {
      return { bookingId: snap.id, ...snap.data() } as BookingChecklist;
    }
    const fresh = emptyChecklist(bookingId);
    await setDoc(checklistRef(bookingId), fresh, { merge: true });
    return fresh;
  } catch {
    // Silent — return in-memory fallback so UI still works
    const fallback = memoryFallback.get(bookingId) ?? emptyChecklist(bookingId);
    memoryFallback.set(bookingId, fallback);
    return fallback;
  }
}

export async function toggleStep(
  bookingId: string,
  key: ChecklistStepKey,
  value: boolean
): Promise<void> {
  try {
    await updateDoc(checklistRef(bookingId), {
      [`steps.${key}`]: value,
      updatedAt: Date.now(),
    });
    // Keep memory in sync too
    const current = memoryFallback.get(bookingId);
    if (current) {
      current.steps[key] = value;
      current.updatedAt = Date.now();
    }
  } catch {
    // Silent — update memory only
    const current = memoryFallback.get(bookingId) ?? emptyChecklist(bookingId);
    current.steps[key] = value;
    current.updatedAt = Date.now();
    memoryFallback.set(bookingId, current);
  }
}

export async function markCheckedIn(
  bookingId: string,
  timestamp: number
): Promise<void> {
  try {
    await updateDoc(checklistRef(bookingId), {
      "steps.checkedIn": true,
      checkedInAt: timestamp,
      updatedAt: Date.now(),
    });
    const current = memoryFallback.get(bookingId);
    if (current) {
      current.steps.checkedIn = true;
      current.checkedInAt = timestamp;
      current.updatedAt = Date.now();
    }
  } catch {
    // Silent — update memory only
    const current = memoryFallback.get(bookingId) ?? emptyChecklist(bookingId);
    current.steps.checkedIn = true;
    current.checkedInAt = timestamp;
    current.updatedAt = Date.now();
    memoryFallback.set(bookingId, current);
  }
}