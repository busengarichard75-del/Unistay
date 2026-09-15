// src/services/auditLogService.ts
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AUDIT_COLLECTION = "auditLog";

export type AuditAction =
  | "hide_property"
  | "unhide_property"
  | "delete_property"
  | "verify_property"
  | "reject_property"
  | "bulk_verify"
  | "bulk_reject"
  | "suspend_user"
  | "unsuspend_user"
  | "confirm_payment"
  | "cancel_booking"
  | "refund_boost"
  | "site_toggle"
  | "send_direct_message"
  | "send_email"
  | "publish_announcement"
  | "hide_announcement"
  | "schedule_announcement"
  | "toggle_boost";

export interface AuditEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetType: "property" | "user" | "booking" | "settings" | "announcement" | "system";
  targetId: string;
  targetLabel: string;
  details?: string;
  timestamp: number;
}

export async function logAdminAction(data: {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetType: AuditEntry["targetType"];
  targetId: string;
  targetLabel: string;
  details?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      ...data,
      timestamp: Date.now(),
    });
  } catch {
    // Silent — audit must never break the flow
  }
}

export async function getRecentAuditEntries(max = 200): Promise<AuditEntry[]> {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AuditEntry, "id">),
    }));
  } catch {
    return [];
  }
}