// src/services/analyticsEventService.ts

import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AnalyticsSource, AnalyticsVertical } from "@/lib/analyticsIdentity";

const EVENTS_COLLECTION = "analytics_events";

export interface EventStats {
  totalEvents: number;
  uniqueVisitors: number;
  newVisitors: number;       // ← NEW
  returningVisitors: number; // ← NEW
  sessions: number;
  pageViews: number;
  pagesPerSession: number;
  bySource: { source: AnalyticsSource; count: number }[];
  byVertical: { vertical: AnalyticsVertical; count: number }[];
  byRole: { role: string; count: number }[];
}

const EMPTY_STATS: EventStats = {
  totalEvents: 0,
  uniqueVisitors: 0,
  newVisitors: 0,
  returningVisitors: 0,
  sessions: 0,
  pageViews: 0,
  pagesPerSession: 0,
  bySource: [],
  byVertical: [],
  byRole: [],
};

export async function getEventStats(sinceMs: number): Promise<EventStats> {
  try {
    if (!db) return EMPTY_STATS;

    const eventsRef = collection(db, EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      where("timestamp", ">=", sinceMs),
      orderBy("timestamp", "desc"),
      limit(1000)
    );
    const snap = await getDocs(q);

    if (snap.empty) return EMPTY_STATS;

    const visitorFirstSeen = new Map<string, number>(); // visitorId → earliest firstSeenAt
    const sessions = new Set<string>();
    const sourceCounts: Record<string, number> = {};
    const verticalCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    let pageViews = 0;

    snap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, any>;

      if (typeof d.visitorId === "string") {
        const existing = visitorFirstSeen.get(d.visitorId);
        const seen = typeof d.firstSeenAt === "number" ? d.firstSeenAt : Date.now();
        // Keep the earliest firstSeenAt we've seen for this visitor
        if (existing === undefined || seen < existing) {
          visitorFirstSeen.set(d.visitorId, seen);
        }
      }

      if (typeof d.sessionId === "string") sessions.add(d.sessionId);

      if (d.action === "page_view") pageViews++;

      if (typeof d.source === "string") {
        sourceCounts[d.source] = (sourceCounts[d.source] || 0) + 1;
      }
      if (typeof d.vertical === "string") {
        verticalCounts[d.vertical] = (verticalCounts[d.vertical] || 0) + 1;
      }
      if (typeof d.role === "string") {
        roleCounts[d.role] = (roleCounts[d.role] || 0) + 1;
      }
    });

    // ─── Split New vs. Returning ───
    // A visitor is NEW in this range if their firstSeenAt is >= sinceMs.
    // "sinceMs === 0" (All time) → everyone is new.
    let newVisitors = 0;
    let returningVisitors = 0;
    visitorFirstSeen.forEach((firstSeen) => {
      if (sinceMs === 0 || firstSeen >= sinceMs) {
        newVisitors++;
      } else {
        returningVisitors++;
      }
    });

    const bySource = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source: source as AnalyticsSource, count }))
      .sort((a, b) => b.count - a.count);

    const byVertical = Object.entries(verticalCounts)
      .map(([vertical, count]) => ({
        vertical: vertical as AnalyticsVertical,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const byRole = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    const sessionCount = sessions.size;
    const pagesPerSession =
      sessionCount > 0 ? Math.round((pageViews / sessionCount) * 100) / 100 : 0;

    return {
      totalEvents: snap.size,
      uniqueVisitors: visitorFirstSeen.size,
      newVisitors,
      returningVisitors,
      sessions: sessionCount,
      pageViews,
      pagesPerSession,
      bySource,
      byVertical,
      byRole,
    };
  } catch (err) {
    console.warn("Failed to fetch event stats:", err);
    return EMPTY_STATS;
  }
}

export const SOURCE_LABELS: Record<AnalyticsSource, string> = {
  direct: "Direct",
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  whatsapp: "WhatsApp",
  twitter: "X / Twitter",
  tiktok: "TikTok",
  referral: "Referral",
  other: "Other",
};

export const VERTICAL_LABELS: Record<AnalyticsVertical, string> = {
  accommodation: "Accommodation",
  services: "Services",
  marketplace: "Marketplace",
  library: "Library",
  provider: "Provider Shops",
  dashboard: "Dashboard",
  admin: "Admin",
  auth: "Auth (Login/Signup)",
  other: "Other",
};