// src/services/pushSubscriptionService.ts
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PushSubscriptionData {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: number;
  userAgent?: string;
}

/**
 * Save push subscription to Firestore
 */
export async function savePushSubscription(subscription: PushSubscription, userId: string): Promise<void> {
  try {
    const subscriptionData: PushSubscriptionData = {
      userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
      },
      createdAt: Date.now(),
      userAgent: navigator.userAgent,
    };

    // Use endpoint as document ID (unique per subscription)
    const docRef = doc(db, "pushSubscriptions", subscription.endpoint);
    await setDoc(docRef, subscriptionData);
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    throw error;
  }
}

/**
 * Remove push subscription from Firestore
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  try {
    const docRef = doc(db, "pushSubscriptions", endpoint);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    throw error;
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getPushSubscriptionsForUser(userId: string): Promise<PushSubscriptionData[]> {
  try {
    const q = query(
      collection(db, "pushSubscriptions"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as PushSubscriptionData);
  } catch (error) {
    console.error("Failed to get push subscriptions:", error);
    return [];
  }
}