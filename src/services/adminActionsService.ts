// src/services/adminActionsService.ts
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAdminAction, AuditAction } from "./auditLogService";
import { createNotification } from "./notificationService";
import { sendPushNotification } from "@/lib/sendPushNotification";

interface AdminContext {
  adminId: string;
  adminEmail: string;
}

// ─── HIDE / UNHIDE PROPERTY ────────────────────────────────────
export async function hideProperty(
  ctx: AdminContext,
  propertyId: string,
  propertyTitle: string,
  ownerId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, "properties", propertyId), {
    adminHidden: true,
    adminHiddenReason: reason,
    adminHiddenAt: Date.now(),
    adminHiddenBy: ctx.adminEmail,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "hide_property",
    targetType: "property",
    targetId: propertyId,
    targetLabel: propertyTitle,
    details: reason,
  });

  // Notify landlord
  try {
    await createNotification(ownerId, {
      title: "Listing hidden",
      body: `Your listing "${propertyTitle}" was hidden by Peza. Reason: ${reason}`,
      type: "announcement",
      link: "/dashboard/landlord",
    });
    await sendPushNotification({
      userId: ownerId,
      title: "Listing hidden",
      body: `Your listing "${propertyTitle}" was hidden. Reason: ${reason}`,
      url: "/dashboard/landlord",
    });
  } catch {
    // silent
  }
}

export async function unhideProperty(
  ctx: AdminContext,
  propertyId: string,
  propertyTitle: string,
  ownerId: string
): Promise<void> {
  await updateDoc(doc(db, "properties", propertyId), {
    adminHidden: false,
    adminHiddenReason: null,
    adminHiddenAt: null,
    adminHiddenBy: null,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "unhide_property",
    targetType: "property",
    targetId: propertyId,
    targetLabel: propertyTitle,
  });

  try {
    await createNotification(ownerId, {
      title: "Listing restored",
      body: `Your listing "${propertyTitle}" is now visible to students again.`,
      type: "announcement",
      link: "/dashboard/landlord",
    });
  } catch {
    // silent
  }
}

// ─── BULK VERIFY ───────────────────────────────────────────────
export async function bulkVerifyProperties(
  ctx: AdminContext,
  propertyIds: string[],
  status: "approved" | "rejected"
): Promise<number> {
  let count = 0;
  for (const id of propertyIds) {
    try {
      await updateDoc(doc(db, "properties", id), {
        verificationStatus: status,
      });
      count++;
    } catch {
      // continue
    }
  }

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: status === "approved" ? "bulk_verify" : "bulk_reject",
    targetType: "property",
    targetId: propertyIds.join(","),
    targetLabel: `${count} properties`,
    details: `Bulk ${status}`,
  });

  return count;
}

// ─── SUSPEND / UNSUSPEND USER (Option A — soft) ────────────────
export async function suspendUser(
  ctx: AdminContext,
  userId: string,
  userLabel: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    suspended: true,
    suspendedReason: reason,
    suspendedAt: Date.now(),
    suspendedBy: ctx.adminEmail,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "suspend_user",
    targetType: "user",
    targetId: userId,
    targetLabel: userLabel,
    details: reason,
  });

  try {
    await createNotification(userId, {
      title: "Account suspended",
      body: `Your Peza account has been suspended. Reason: ${reason}. Contact support.`,
      type: "announcement",
      link: "/help",
    });
  } catch {
    // silent
  }
}

export async function unsuspendUser(
  ctx: AdminContext,
  userId: string,
  userLabel: string
): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    suspended: false,
    suspendedReason: null,
    suspendedAt: null,
    suspendedBy: null,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "unsuspend_user",
    targetType: "user",
    targetId: userId,
    targetLabel: userLabel,
  });

  try {
    await createNotification(userId, {
      title: "Account restored",
      body: "Your Peza account is now active again. Welcome back!",
      type: "announcement",
      link: "/",
    });
  } catch {
    // silent
  }
}

// ─── REFUND BOOST ──────────────────────────────────────────────
export async function refundBoost(
  ctx: AdminContext,
  propertyId: string,
  propertyTitle: string
): Promise<void> {
  await updateDoc(doc(db, "properties", propertyId), {
    isBoosted: false,
    boostedAt: null,
    boostExpiry: null,
    boostRefundedAt: Date.now(),
    boostRefundedBy: ctx.adminEmail,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "refund_boost",
    targetType: "property",
    targetId: propertyId,
    targetLabel: propertyTitle,
    details: "Boost refunded (K100)",
  });
}

// ─── CANCEL BOOKING ────────────────────────────────────────────
export async function cancelBooking(
  ctx: AdminContext,
  bookingId: string,
  bookingLabel: string,
  studentId: string,
  landlordId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, "bookings", bookingId), {
    status: "cancelled",
    cancelledAt: Date.now(),
    cancelledBy: ctx.adminEmail,
    cancelReason: reason,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "cancel_booking",
    targetType: "booking",
    targetId: bookingId,
    targetLabel: bookingLabel,
    details: reason,
  });

  try {
    await createNotification(studentId, {
      title: "Booking cancelled",
      body: `Your booking "${bookingLabel}" was cancelled. Reason: ${reason}`,
      type: "booking_rejected",
      link: "/dashboard/student",
    });
    await createNotification(landlordId, {
      title: "Booking cancelled",
      body: `Booking "${bookingLabel}" was cancelled by admin. Reason: ${reason}`,
      type: "booking_rejected",
      link: "/dashboard/landlord",
    });
  } catch {
    // silent
  }
}

// ─── GLOBAL SITE TOGGLE (Option C — read-only) ─────────────────
export type SiteMode = "off" | "readonly";

export async function setSiteMode(
  ctx: AdminContext,
  mode: SiteMode,
  message?: string
): Promise<void> {
  await updateDoc(doc(db, "settings", "main"), {
    siteMode: mode,
    siteModeMessage: message || null,
    siteModeUpdatedAt: Date.now(),
    siteModeUpdatedBy: ctx.adminEmail,
  });

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "site_toggle",
    targetType: "settings",
    targetId: "main",
    targetLabel: `Site mode = ${mode}`,
    details: message,
  });
}

export async function getSiteMode(): Promise<{ mode: SiteMode; message?: string }> {
  try {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (!snap.exists()) return { mode: "off" };
    const data = snap.data();
    return {
      mode: (data.siteMode as SiteMode) || "off",
      message: data.siteModeMessage || undefined,
    };
  } catch {
    return { mode: "off" };
  }
}

// ─── DIRECT MESSAGE (reuses notifications) ─────────────────────
export async function sendDirectMessage(
  ctx: AdminContext,
  toUserId: string,
  toLabel: string,
  title: string,
  body: string
): Promise<void> {
  await createNotification(toUserId, {
    title,
    body,
    type: "announcement",
    link: "/dashboard/notifications",
  });

  try {
    await sendPushNotification({
      userId: toUserId,
      title,
      body,
      url: "/dashboard/notifications",
    });
  } catch {
    // silent
  }

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "send_direct_message",
    targetType: "user",
    targetId: toUserId,
    targetLabel: toLabel,
    details: title,
  });
}