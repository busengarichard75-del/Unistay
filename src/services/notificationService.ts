// src/services/notificationService.ts
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "booking_approved" | "booking_rejected" | "booking_confirmed" | "booking_requested" | "booking_expired" | "announcement";
  read: boolean;
  createdAt: number;
  link?: string;
  metadata?: Record<string, any>;
}

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Get all notifications for a user (real-time listener)
 * 
 * ⚠️ Temporarily removed orderBy("createdAt", "desc") because the index is still building.
 * Once the index is ready, re-add it for proper server-side ordering.
 */
export function listenToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    // Sort client-side by createdAt (newest first) as a fallback
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    callback(notifications);
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(updates);
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * Clear all notifications for a user
 */
export async function clearAllNotifications(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    const deletions = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletions);
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    throw error;
  }
}

/**
 * Create a notification (called from server-side or API)
 */
export async function createNotification(
  userId: string,
  data: Omit<Notification, "id" | "userId" | "createdAt" | "read">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      ...data,
      read: false,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}