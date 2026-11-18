
// src/types/payment.ts

export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "refunded";

export type PaymentType =
  | "agent_fee"
  | "boost"
  | "accommodation_rent"
  | "provider_subscription" // Retained for legacy compatibility
  | "provider_plan_pro"
  | "provider_plan_full_time"
  | "service_plan_standard"
  | "service_plan_pro";

export interface PaymentRecord {
  id: string;
  userId: string;
  recipientId?: string;
  type: PaymentType;

  // Gateway Data
  gatewayName: "manual_mobile_money" | "flutterwave" | "ontech";
  gatewayTransactionId?: string;
  gatewayReference: string;

  // Financials
  amount: number;
  currency: string;
  commissionAmount?: number;

  // Status & Linking
  status: PaymentStatus;
  linkedBookingId?: string;
  linkedListingId?: string;

  // Audit
  createdAt: number;
  verifiedAt?: number;
  failureReason?: string;
  webhookPayload?: string;
}
