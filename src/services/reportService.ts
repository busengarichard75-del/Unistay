// src/services/reportService.ts

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report, ReportReason, ReportStatus, ReportTargetType } from "@/types/report";

const reportsRef = collection(db, "reports");

interface SubmitReportData {
  reporterId: string;
  reporterEmail: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetOwnerId: string;
  reason: ReportReason;
  note?: string;
}

/**
 * Check if a user has already reported a specific target.
 * Prevents duplicate report spam.
 */
export async function hasUserReportedTarget(
  reporterId: string,
  targetId: string
): Promise<boolean> {
  try {
    const q = query(
      reportsRef,
      where("reporterId", "==", reporterId),
      where("targetId", "==", targetId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function submitReport(data: SubmitReportData): Promise<string> {
  const docRef = await addDoc(reportsRef, {
    ...data,
    status: "pending" as ReportStatus,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getAllReports(): Promise<Report[]> {
  try {
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminEmail: string
): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    reviewedAt: Date.now(),
    reviewedBy: adminEmail,
  });
}