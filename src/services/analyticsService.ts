// src/services/analyticsService.ts
import {
  collection,
  addDoc,
  getDocs,
  getCountFromServer,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const VISITS_COLLECTION = "analytics_visits";
const VISITOR_KEY = "peza_visitor_id";

// Safety cap for the aggregation pass — only affects breakdown numbers
// (unique visitors, role/device splits, top pages).
// Total visits uses getCountFromServer so it's always accurate.
const AGGREGATION_FETCH_LIMIT = 5000;

export type VisitorRole = "guest" | "student" | "landlord";
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface VisitRecord {
  id: string;
  visitorId: string;
  userId: string | null;
  role: VisitorRole;
  path: string;
  normalizedPath: string;
  device: DeviceType;
  referrer: string | null;
  timestamp: number;
}

export interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  byRole: Record<VisitorRole, number>;
  byDevice: Record<DeviceType, number>;
  topPages: { path: string; count: number }[];
  recentVisits: VisitRecord[];
}

// ─── Visitor ID (anonymous, persistent per device) ────────────
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// Convert /property/abc123xyz → /property/*  (so we group similar pages)
function normalizePath(path: string): string {
  return path.replace(/\/[a-zA-Z0-9]{15,}/g, "/*");
}

// ─── Log a visit ──────────────────────────────────────────────
export async function logVisit(data: {
  userId: string | null;
  role: VisitorRole;
  path: string;
  referrer: string | null;
}): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    const device = detectDevice();
    const normalizedPath = normalizePath(data.path);

    await addDoc(collection(db, VISITS_COLLECTION), {
      visitorId,
      userId: data.userId,
      role: data.role,
      path: data.path,
      normalizedPath,
      device,
      referrer: data.referrer,
      timestamp: Date.now(),
    });
  } catch {
    // Silent — analytics must never break the app
  }
}

// ─── Fetch + aggregate stats for admin ────────────────────────
export async function getVisitStats(sinceMs: number): Promise<VisitStats> {
  const emptyStats: VisitStats = {
    totalVisits: 0,
    uniqueVisitors: 0,
    byRole: { guest: 0, student: 0, landlord: 0 },
    byDevice: { mobile: 0, tablet: 0, desktop: 0 },
    topPages: [],
    recentVisits: [],
  };

  try {
    const visitsRef = collection(db, VISITS_COLLECTION);

    // ⚡ Accurate total — uses Firestore aggregation, no cap
    let totalVisits = 0;
    try {
      const countSnap = await getCountFromServer(
        query(visitsRef, where("timestamp", ">=", sinceMs))
      );
      totalVisits = countSnap.data().count;
    } catch (err) {
      console.warn("Count query failed, falling back to fetch length:", err);
    }

    // Fetch a capped sample for breakdown (unique/role/device/pages)
    const q = query(
      visitsRef,
      where("timestamp", ">=", sinceMs),
      orderBy("timestamp", "desc"),
      limit(AGGREGATION_FETCH_LIMIT)
    );
    const snap = await getDocs(q);

    const visits: VisitRecord[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<VisitRecord, "id">),
    }));

    // If count query failed, fall back to fetch length
    if (totalVisits === 0 && visits.length > 0) {
      totalVisits = visits.length;
    }

    if (visits.length === 0) {
      return { ...emptyStats, totalVisits };
    }

    // Aggregate
    const uniqueSet = new Set<string>();
    const byRole: Record<VisitorRole, number> = { guest: 0, student: 0, landlord: 0 };
    const byDevice: Record<DeviceType, number> = { mobile: 0, tablet: 0, desktop: 0 };
    const pathCounts: Record<string, number> = {};

    visits.forEach((v) => {
      uniqueSet.add(v.visitorId);
      if (v.role in byRole) byRole[v.role]++;
      if (v.device in byDevice) byDevice[v.device]++;
      pathCounts[v.normalizedPath] = (pathCounts[v.normalizedPath] || 0) + 1;
    });

    const topPages = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalVisits,
      uniqueVisitors: uniqueSet.size,
      byRole,
      byDevice,
      topPages,
      recentVisits: visits.slice(0, 20),
    };
  } catch (err) {
    console.warn("Failed to fetch visit stats:", err);
    return emptyStats;
  }
}