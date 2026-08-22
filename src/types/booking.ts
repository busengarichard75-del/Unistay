import { PaymentPeriod } from "./property";

export type BookingStatus = "requested" | "approved" | "confirmed" | "rejected";

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;    // ✅ NEW – store student's phone for landlord view
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
}