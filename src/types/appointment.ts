// src/types/appointment.ts

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  date: string; // "2026-11-15"
  time: string; // "14:30"
  notes?: string;
  status: AppointmentStatus;
  createdAt: number;
}