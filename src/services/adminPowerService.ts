// src/services/adminPowerService.ts
import {
  doc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { logAdminAction } from "./auditLogService";
import { createNotification } from "./notificationService";
import type { ProviderPlan } from "@/types/user";

interface AdminContext {
  adminId: string;
  adminEmail: string;
}

// ─── DELETE LISTING (hard delete + audit) ───────────────────
export async function deleteListingAdmin(
  ctx: AdminContext,
  kind: "property" | "service" | "product",
  id: string,
  title: string,
  ownerId: string,
  reason: string
): Promise<void> {
  const col = kind === "property" ? "properties" : kind === "service" ? "services" : "products";

  await deleteDoc(doc(db, col, id));

  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "delete_listing",
    targetType: kind,
    targetId: id,
    targetLabel: title,
    details: reason,
  });

  try {
    await createNotification(ownerId, {
      title: "Listing removed",
      body: `Your listing "${title}" was removed by Peza. Reason: ${reason}`,
      type: "announcement",
      link: kind === "property" ? "/dashboard/landlord" : "/dashboard/provider",
    });
  } catch { /* silent */ }
}

// ─── HIDE LISTING (soft, reversible) ─────────────────────────
export async function hideListingAdmin(
  ctx: AdminContext,
  kind: "service" | "product",
  id: string,
  title: string,
  reason: string
): Promise<void> {
  const col = kind === "service" ? "services" : "products";
  await updateDoc(doc(db, col, id), {
    adminHidden: true,
    adminHiddenReason: reason,
    adminHiddenAt: Date.now(),
    adminHiddenBy: ctx.adminEmail,
  });
  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "hide_listing",
    targetType: kind,
    targetId: id,
    targetLabel: title,
    details: reason,
  });
}

export async function unhideListingAdmin(
  ctx: AdminContext,
  kind: "service" | "product",
  id: string,
  title: string
): Promise<void> {
  const col = kind === "service" ? "services" : "products";
  await updateDoc(doc(db, col, id), {
    adminHidden: false,
    adminHiddenReason: null,
    adminHiddenAt: null,
    adminHiddenBy: null,
  });
  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "unhide_listing",
    targetType: kind,
    targetId: id,
    targetLabel: title,
  });
}

// ─── FORCE PASSWORD RESET ────────────────────────────────────
export async function forcePasswordReset(
  ctx: AdminContext,
  userEmail: string,
  userLabel: string
): Promise<void> {
  await sendPasswordResetEmail(auth, userEmail);
  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "force_password_reset",
    targetType: "user",
    targetId: userEmail,
    targetLabel: userLabel,
  });
}

// ─── UPDATE USER PLAN ────────────────────────────────────────
export async function updateUserPlanAdmin(
  ctx: AdminContext,
  userId: string,
  userLabel: string,
  plan: ProviderPlan
): Promise<void> {
  const planExpiry = plan === "basic" ? null : Date.now() + 30 * 86400000;
  await updateDoc(doc(db, "users", userId), { plan, planExpiry });
  await logAdminAction({
    adminId: ctx.adminId,
    adminEmail: ctx.adminEmail,
    action: "update_plan",
    targetType: "user",
    targetId: userId,
    targetLabel: userLabel,
    details: `Plan → ${plan}`,
  });
}

// ─── LIVE STATS (accurate, fast, cheap) ──────────────────────
export interface LiveStats {
  totalUsers: number;
  totalStudents: number;
  totalLandlords: number;
  totalProviders: number;
  suspendedUsers: number;
  totalProperties: number;
  totalServices: number;
  totalProducts: number;
  hiddenProperties: number;
  hiddenServices: number;
  hiddenProducts: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  newUsers7d: number;
  newUsers30d: number;
  agentFeeRevenue: number;
}

export async function getLiveStats(): Promise<LiveStats> {
  const usersRef = collection(db, "users");
  const propsRef = collection(db, "properties");
  const servicesRef = collection(db, "services");
  const productsRef = collection(db, "products");
  const bookingsRef = collection(db, "bookings");

  const weekAgo = Date.now() - 7 * 86400000;
  const monthAgo = Date.now() - 30 * 86400000;

  const [totalUsers, totalStudents, totalLandlords, totalProviders, suspendedUsers,
         totalProperties, totalServices, totalProducts,
         hiddenProperties, hiddenServices, hiddenProducts,
         totalBookings, confirmedBookings, pendingBookings, cancelledBookings,
         newUsers7d, newUsers30d] = await Promise.all([
    getCountFromServer(usersRef),
    getCountFromServer(query(usersRef, where("role", "==", "student"))),
    getCountFromServer(query(usersRef, where("role", "==", "landlord"))),
    getCountFromServer(query(usersRef, where("role", "==", "service_provider"))),
    getCountFromServer(query(usersRef, where("suspended", "==", true))),
    getCountFromServer(propsRef),
    getCountFromServer(servicesRef),
    getCountFromServer(productsRef),
    getCountFromServer(query(propsRef, where("adminHidden", "==", true))),
    getCountFromServer(query(servicesRef, where("adminHidden", "==", true))),
    getCountFromServer(query(productsRef, where("adminHidden", "==", true))),
    getCountFromServer(bookingsRef),
    getCountFromServer(query(bookingsRef, where("status", "==", "confirmed"))),
    getCountFromServer(query(bookingsRef, where("status", "==", "approved"))),
    getCountFromServer(query(bookingsRef, where("status", "==", "cancelled"))),
    getCountFromServer(query(usersRef, where("createdAt", ">=", weekAgo))),
    getCountFromServer(query(usersRef, where("createdAt", ">=", monthAgo))),
  ]);

  const confirmed = confirmedBookings.data().count;

  return {
    totalUsers: totalUsers.data().count,
    totalStudents: totalStudents.data().count,
    totalLandlords: totalLandlords.data().count,
    totalProviders: totalProviders.data().count,
    suspendedUsers: suspendedUsers.data().count,
    totalProperties: totalProperties.data().count,
    totalServices: totalServices.data().count,
    totalProducts: totalProducts.data().count,
    hiddenProperties: hiddenProperties.data().count,
    hiddenServices: hiddenServices.data().count,
    hiddenProducts: hiddenProducts.data().count,
    totalBookings: totalBookings.data().count,
    confirmedBookings: confirmed,
    pendingBookings: pendingBookings.data().count,
    cancelledBookings: cancelledBookings.data().count,
    newUsers7d: newUsers7d.data().count,
    newUsers30d: newUsers30d.data().count,
    agentFeeRevenue: confirmed * 100,
  };
}

// ─── CSV EXPORTS ─────────────────────────────────────────────
function toCSV(headers: string[], rows: any[][]): string {
  const esc = (v: any) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportUsersCSV(): Promise<number> {
  const snap = await getDocs(collection(db, "users"));
  const rows = snap.docs.map((d) => {
    const u = d.data();
    return [d.id, u.fullName || "", u.email || "", u.phone || "", u.role || "",
            u.plan || "basic", u.suspended ? "yes" : "no", u.createdAt || ""];
  });
  const csv = toCSV(
    ["UID", "Full Name", "Email", "Phone", "Role", "Plan", "Suspended", "Created At"],
    rows
  );
  downloadCSV(`peza-users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  return rows.length;
}

export async function exportBookingsCSV(): Promise<number> {
  const snap = await getDocs(collection(db, "bookings"));
  const rows = snap.docs.map((d) => {
    const b = d.data();
    return [d.id, b.propertyTitle || "", b.studentName || "", b.landlordId || "",
            b.status || "", b.price || 0, b.createdAt || ""];
  });
  const csv = toCSV(
    ["Booking ID", "Property", "Student", "Landlord ID", "Status", "Price", "Created"],
    rows
  );
  downloadCSV(`peza-bookings-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  return rows.length;
}

export async function exportListingsCSV(): Promise<number> {
  const [pSnap, sSnap, prSnap] = await Promise.all([
    getDocs(collection(db, "properties")),
    getDocs(collection(db, "services")),
    getDocs(collection(db, "products")),
  ]);
  const rows: any[][] = [];
  pSnap.forEach((d) => {
    const x = d.data();
    rows.push(["property", d.id, x.title, x.ownerId, x.price, x.verificationStatus || "", x.adminHidden ? "hidden" : "live"]);
  });
  sSnap.forEach((d) => {
    const x = d.data();
    rows.push(["service", d.id, x.title, x.ownerId, x.priceFrom || 0, "", x.adminHidden ? "hidden" : "live"]);
  });
  prSnap.forEach((d) => {
    const x = d.data();
    rows.push(["product", d.id, x.name, x.ownerId, x.price, "", x.adminHidden ? "hidden" : "live"]);
  });
  const csv = toCSV(["Type", "ID", "Title/Name", "Owner ID", "Price", "Verification", "State"], rows);
  downloadCSV(`peza-listings-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  return rows.length;
}