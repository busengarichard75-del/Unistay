import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COUNTER_COLLECTION = "counters";
const COUNTER_DOC_ID = "bookingCounter";

async function getNextSequence(): Promise<number> {
  const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOC_ID);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentCount = snapshot.exists() ? snapshot.data()?.value || 0 : 0;
    const newCount = currentCount + 1;
    transaction.set(counterRef, { value: newCount });
    return newCount;
  });
}

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateVerificationToken(): string {
  // Using crypto.randomUUID if available (modern Node.js / Next.js 16)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for safety
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function generateBookingConfirmationData() {
  const sequence = await getNextSequence();
  const year = new Date().getFullYear();
  const confirmationId = `PEZA-${year}-${String(sequence).padStart(5, '0')}`;
  const confirmationCode = generateConfirmationCode();
  const verificationToken = generateVerificationToken();

  return {
    confirmationId,
    confirmationCode,
    verificationToken,
    approvedAt: Date.now(),
  };
}