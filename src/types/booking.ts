// src/types/booking.ts
import { PaymentPeriod } from "./property";

export type BookingStatus = "requested" | "approved" | "confirmed" | "rejected" | "expired";

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  landlordId: string;
  propertyId: string;
  bedSpaceId: string;
  propertyTitle: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  status: BookingStatus;
  createdAt: number;
  confirmationId?: string;
  confirmationCode?: string;
  approvedAt?: number;
  confirmedAt?: number;
  verificationToken?: string;
  studentNumber?: string;
  approvalExpiresAt?: number; // ✅ New – timestamp when approval expires
  expiredAt?: number;          // ✅ New – timestamp when expired
}