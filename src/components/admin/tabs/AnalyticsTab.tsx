// src/components/admin/tabs/AnalyticsTab.tsx
"use client";

import {
  Eye,
  Users,
  GraduationCap,
  UserX,
  Smartphone,
  Tablet,
  Monitor,
  TrendingUp,
} from "lucide-react";
import { AnalyticsCard } from "@/components/admin/shared";
import type {
  VisitStats,
  VisitorRole,
  DeviceType,
} from "@/services/analyticsService";

interface AnalyticsTabProps {
  analytics: VisitStats | null;
  isFetchingAnalytics: boolean;
  analyticsRange: "24h" | "7d" | "30d" | "all";
  onAnalyticsRangeChange: (r: "24h" | "7d" | "30d" | "all") => void;
}

const RANGE_LABELS: Record<"24h" | "7d" | "30d" | "all", string> = {
  "24h": "Last 24h",
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
};

export function AnalyticsTab({
  analytics,
  isFetchingAnalytics,
  analyticsRange,
  onAnalyticsRangeChange,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex flex-wrap gap-2">
        {(["24h", "7d", "30d", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => onAnalyticsRangeChange(r)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              analyticsRange === r
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {isFetchingAnalytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-24 bg-gray-900/50 rounded-xl border border-gray-800"
            />
          ))}
        </div>
      ) : !analytics || analytics.totalVisits === 0 ? (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
          <Eye size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">No visits yet in this range.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              label="Total visits"
              value={analytics.totalVisits.toLocaleString()}
              icon={Eye}
              color="text-blue-400"
            />
            <AnalyticsCard
              label="Unique visitors"
              value={analytics.uniqueVisitors.toLocaleString()}
              icon={Users}
              color="text-green-400"
            />
            <AnalyticsCard
              label="Students"
              value={analytics.byRole.student.toLocaleString()}
              icon={GraduationCap}
              color="text-blue-400"
            />
            <AnalyticsCard
              label="Guests"
              value={analytics.byRole.guest.toLocaleString()}
              icon={UserX}
              color="text-gray-400"
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By role */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users size={16} className="text-blue-400" /> By role
              </h3>
              {(["student", "landlord", "guest"] as VisitorRole[]).map((r) => {
                const count = analytics.byRole[r] || 0;
                const pct =
                  analytics.totalVisits > 0
                    ? (count / analytics.totalVisits) * 100
                    : 0;
                return (
                  <div key={r} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 capitalize">
                        {r}
                      </span>
                      <span className="text-xs text-gray-400">
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          r === "student"
                            ? "bg-blue-500"
                            : r === "landlord"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* By device */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Smartphone size={16} className="text-purple-400" /> By device
              </h3>
              {(["mobile", "tablet", "desktop"] as DeviceType[]).map((d) => {
                const count = analytics.byDevice[d] || 0;
                const pct =
                  analytics.totalVisits > 0
                    ? (count / analytics.totalVisits) * 100
                    : 0;
                const Icon =
                  d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;
                return (
                  <div key={d} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 flex items-center gap-1">
                        <Icon size={11} /> {d}
                      </span>
                      <span className="text-xs text-gray-400">
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top pages */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" /> Top pages
            </h3>
            {analytics.topPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-300 font-mono truncate">
                  {p.path}
                </span>
                <span className="text-xs text-gray-400 ml-2">{p.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}