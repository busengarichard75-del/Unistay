// src/services/userService.ts

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Publicly safe user profile.
 * Deliberately excludes email, phone, and other private fields.
 * Used for provider profile pages.
 */
export interface PublicUserProfile {
  uid: string;
  displayName: string;
  businessName?: string;
  university?: string;
  role: "student" | "landlord" | "service_provider";
  providerType?: "service" | "product";
  verificationStatus?: "pending" | "approved" | "rejected";
  isVerified: boolean;
  isSuspended: boolean;
  memberSince?: number;
  /** Avatar URL — service_provider only. */
  photoURL?: string;
}

export async function getPublicUserProfile(
  uid: string
): Promise<PublicUserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;

    const data = snap.data() as Record<string, any>;
    const displayName =
      data.businessName ||
      data.fullName ||
      data.name ||
      data.displayName ||
      "Peza Provider";

    return {
      uid: snap.id,
      displayName,
      businessName: data.businessName,
      university: data.university,
      role: data.role || "service_provider",
      providerType: data.providerType,
      verificationStatus: data.verificationStatus,
      isVerified: data.verificationStatus === "approved",
      isSuspended: !!data.suspended,
      memberSince: data.createdAt,
      photoURL: data.photoURL || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch public user profile:", error);
    return null;
  }
}