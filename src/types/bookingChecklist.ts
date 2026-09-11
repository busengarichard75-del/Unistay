// src/types/bookingChecklist.ts

export type ChecklistStepKey =
  | "paymentReceived"
  | "landlordContacted"
  | "checkedIn";

export interface BookingChecklist {
  bookingId: string;
  steps: Record<ChecklistStepKey, boolean>;
  checkedInAt?: number;
  createdAt: number;
  updatedAt: number;
}