import { PaymentPeriod } from "./property";

export type BookingStatus = "requested" | "approved" | "confirmed" | "rejected";

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  landlordId: string;
  propertyId: string;
  bedSpaceId: string;
  propertyTitle: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  status: BookingStatus;
  createdAt: number;
}