import { Preferences } from "@/lib/recommendation/types";

export type UserRole = "student" | "landlord"; // ✅ Define the role type

export interface User {
  uid: string;               // Firebase Auth UID (also the Firestore document ID)
  fullName: string;          // Full name as on NRC
  email: string;
  phone: string;
  role: UserRole;            // ✅ Now properly defined
  createdAt: number;
  hasAcceptedTerms: boolean;
  emailVerified: boolean;    // ✅ New
  studentNumber?: string;    // only for students
  university?: string;       // university ID from the universities list
  preferences?: Preferences; // stored from Find My Best House
}