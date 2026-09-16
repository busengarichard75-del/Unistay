import { Preferences } from "@/lib/recommendation/types";

export type UserRole = "student" | "landlord" | "service_provider";
export type ProviderType = "service" | "product";

export type VerificationStatus = "pending" | "approved" | "rejected";

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

  // ─── Service provider fields ───
  whatsapp?: string;
  businessName?: string;
  providerType?: ProviderType;

  // ─── Provider verification ───
  verificationStatus?: VerificationStatus;
  verificationReviewedAt?: number;
  verificationReviewedBy?: string;
  verificationReason?: string | null;
}