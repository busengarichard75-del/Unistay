import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const UNANSWERED_QUESTIONS_COLLECTION = "unansweredQuestions";

/**
 * Logs a student's unanswered question to Firestore for later review by admin.
 * This is a "fire and forget" operation – errors are caught and logged, but never thrown.
 * 
 * @param data - The message and optional user info.
 * @param data.message - The exact text the student typed.
 * @param data.userId - The user's Firebase UID (if logged in).
 * @param data.userEmail - The user's email (if logged in).
 */
export async function logUnansweredQuestion(data: {
  message: string;
  userId?: string | null;
  userEmail?: string | null;
}): Promise<void> {
  try {
    await addDoc(collection(db, UNANSWERED_QUESTIONS_COLLECTION), {
      message: data.message,
      userId: data.userId || null,
      userEmail: data.userEmail || null,
      createdAt: serverTimestamp(), // ✅ Firestore's server timestamp ensures consistency across time zones
      resolved: false,
    });
  } catch (error) {
    // Silent fail – never interrupt the student's chat experience.
    console.error("Failed to log unanswered question:", error);
  }
}