// src/types/user.ts

// Line 1 — import
import { Preferences } from "@/lib/recommendation/types";

// Lines 3-5 — type aliases
export type UserRole = "student" | "landlord" | "service_provider";
export type ProviderType = "service" | "product";
export type VerificationStatus = "pending" | "approved" | "rejected";

// ─── Shop customization (providers only) ───
export type ShopAccentColor =
  | "indigo"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "slate";

export interface ShopSettings {
  /** Preset accent palette id — controls the shop header gradient */
  accentColor?: ShopAccentColor;
  /** Short one-liner shown under the shop name (max 80 chars) */
  tagline?: string;
  /** Optional banner image URL (Cloudinary, ~1600x400) */
  bannerUrl?: string;
  /** A pinned listing shown at the top of the shop */
  featuredListingId?: string;
  /** Whether the featured item is a service or product */
  featuredListingType?: "service" | "product";
}

// Lines 7-31 — the User interface
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

  /** 🎨 Provider-only shop customization */
  shopSettings?: ShopSettings;

  verificationStatus?: VerificationStatus;
  verificationReviewedAt?: number;
  verificationReviewedBy?: string;
  verificationReason?: string | null;

  // ─── Follows (additive) ───
  /** Number of users following this provider. Computed on read; may be unused. */
  followerCount?: number;
}