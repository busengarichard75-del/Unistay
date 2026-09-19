// Line 1 — import
import { Preferences } from "@/lib/recommendation/types";

// Lines 3-5 — type aliases
export type UserRole = "student" | "landlord" | "service_provider";
export type ProviderType = "service" | "product";
export type VerificationStatus = "pending" | "approved" | "rejected";

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

  photoURL?: string;                    // ← the ONE new line

  verificationStatus?: VerificationStatus;
  verificationReviewedAt?: number;
  verificationReviewedBy?: string;
  verificationReason?: string | null;
}