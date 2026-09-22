// src/types/report.ts

export type ReportTargetType = "service" | "product" | "review";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ReportReason =
  | "inappropriate"
  | "spam"
  | "scam"
  | "wrong_category"
  | "duplicate"
  | "other";

export interface Report {
  id: string;
  reporterId: string;
  reporterEmail: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetOwnerId: string;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export const REPORT_REASONS: { id: ReportReason; label: string; icon: string }[] = [
  { id: "inappropriate", label: "Inappropriate content", icon: "🚫" },
  { id: "spam", label: "Spam or misleading", icon: "📢" },
  { id: "scam", label: "Scam or fraud", icon: "⚠️" },
  { id: "wrong_category", label: "Wrong category", icon: "🏷️" },
  { id: "duplicate", label: "Duplicate listing", icon: "📄" },
  { id: "other", label: "Other", icon: "💬" },
];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: "Inappropriate content",
  spam: "Spam or misleading",
  scam: "Scam or fraud",
  wrong_category: "Wrong category",
  duplicate: "Duplicate listing",
  other: "Other",
};