// src/types/askPeza.ts

export interface AskPezaRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  requestText: string;
  status: "pending" | "found" | "cancelled";
  createdAt: number;
  adminNotes?: string;
}