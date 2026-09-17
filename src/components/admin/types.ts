// src/components/admin/types.ts

export type AdminTab =
  | "dashboard" | "payments" | "properties" | "users" | "shop"
  | "bookings" | "comms" | "analytics" | "reports" | "tools";

export interface UnansweredQuestion {
  id: string;
  message: string;
  userId: string | null;
  userEmail: string | null;
  createdAt: any;
  resolved: boolean;
}

export interface DirectoryUser {
  uid: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: "student" | "landlord" | "service_provider";
  university?: string;
  studentNumber?: string;
  createdAt?: number;
  suspended?: boolean;
  suspendedReason?: string | null;

  businessName?: string;
  whatsapp?: string;
  providerType?: "service" | "product";
  verificationStatus?: "pending" | "approved" | "rejected";
  verificationReviewedAt?: number;
  verificationReviewedBy?: string;
  verificationReason?: string | null;
}

export interface AdminStats {
  totalProperties: number;
  totalBookings: number;
  pendingPayments: number;
  boostedListings: number;
  totalStudents: number;
  totalLandlords: number;
  completedBookings: number;
  boostRevenue: number;
  agentFeeRevenue: number;
  totalRevenue: number;
  hiddenProperties: number;
}