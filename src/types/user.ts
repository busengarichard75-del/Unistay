// src/types/user.ts

import { Preferences } from "@/lib/recommendation/types";

export type UserRole = "student" | "landlord" | "service_provider";
export type ProviderType = "service" | "product";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type ProviderPlan = "basic" | "pro" | "full_time";

export type ShopAccentColor =
  | "indigo"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "slate";

export interface ShopSettings {
  accentColor?: ShopAccentColor;
  tagline?: string;
  bannerUrl?: string;
  featuredListingId?: string;
  featuredListingType?: "service" | "product";
}

export interface User {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: number;
  hasAcceptedTerms: boolean;
  emailVerified: boolean;
  studentNumber?: string;
  university?: string;
  preferences?: Preferences;

  whatsapp?: string;
  businessName?: string;
  providerType?: ProviderType;

  photoURL?: string;

  shopSettings?: ShopSettings;

  verificationStatus?: VerificationStatus;
  verificationReviewedAt?: number;
  verificationReviewedBy?: string;
  verificationReason?: string | null;

  // ─── Subscription / Plans (additive) ───
  /** The provider's current plan tier. Defaults to basic if undefined. */
  plan?: ProviderPlan;
  /** Timestamp when their paid plan expires and drops to basic. */
  planExpiry?: number;

  // ─── Follows (additive) ───
  followerCount?: number;

  // ─── Reviews (additive) ───
  providerRatingAvg?: number;
  providerRatingCount?: number;
}