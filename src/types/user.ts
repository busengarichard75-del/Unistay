// src/types/user.ts
import { Preferences } from "@/lib/recommendation/types";

export type UserRole = "student" | "landlord";

export interface User {
  uid: string;               // Firebase Auth UID (also the Firestore document ID)
  fullName: string;          // Full name as on NRC
  email: string;
  phone: string;
  role: UserRole;
  createdAt: number;
  hasAcceptedTerms: boolean;
  emailVerified: boolean;
  studentNumber?: string;    // only for students
  university?: string;       // university ID from the universities list
  preferences?: Preferences; // stored from Find My Best House

  // ─── Admin moderation ────────────────────────────────────────
  suspended?: boolean;
  suspendedReason?: string | null;
  suspendedAt?: number | null;
  suspendedBy?: string | null;   // admin email who suspended
}