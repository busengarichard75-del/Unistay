import { PaymentPeriod } from "./property";

export type BookingStatus = "requested" | "approved" | "confirmed" | "rejected";

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber?: string; // ✅ NEW: User-entered institution ID
  landlordId: string;
  propertyId: string;
  bedSpaceId: string;
  propertyTitle: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  status: BookingStatus;
  createdAt: number;

  // Confirmation fields
  confirmationId?: string;
  confirmationCode?: string;
  approvedAt?: number;
  confirmedAt?: number;
  verificationToken?: string;
}