"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  GraduationCap,
  Home,
  UserX,
  ArrowLeft,
  BarChart3,
  Clock,
  Info,
  Globe,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { getVisitStats, VisitStats, VisitorRole, DeviceType } from "@/services/analyticsService";
import {
  getEventStats,
  EventStats,
  SOURCE_LABELS,
  VERTICAL_LABELS,
} from "@/services/analyticsEventService";

const ADMIN_PIN = "3542";
const PIN_SESSION_KEY = "peza_admin_pin_ok";

type Range = "24h" | "7d" | "30d" | "all";

function rangeToMs(range: Range): number {
  switch (range) {
    case "24h": return Date.now() - 24 * 60 * 60 * 1000;
    case "7d": return Date.now() - 7 * 24 * 60 * 60 * 1000;
    case "30d": return Date.now() - 30 * 24 * 60 * 60 * 1000;
    case "all": return 0;
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

const ROLE_META: Record<VisitorRole, { label: string; icon: typeof Users; color: string }> = {
  guest: { label: "Guests", icon: UserX, color: "text-gray-400" },
  student: { label: "Students", icon: GraduationCap, color: "text-blue-400" },
  landlord: { label: "Landlords", icon: Home, color: "text-green-400" },
};

const DEVICE_META: Record<DeviceType, { label: string; icon: typeof Smartphone }> = {
  mobile: { label: "Mobile", icon: Smartphone },
  tablet: { label: "Tablet", icon: Tablet },
  desktop: { label: "Desktop", icon: Monitor },
};

export default function AdminAnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");

  const [range, setRange] = useState<Range>("7d");
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // ─── NEW: event-pipeline stats ───
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);

  // Restore PIN from session
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(PIN_SESSION_KEY) === "1") {
      setIsPinVerified(true);
    }
  }, []);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAdminEmail(user?.email)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Fetch legacy stats (unchanged)
  useEffect(() => {
    if (!isPinVerified) return;
    let active = true;
    setIsFetching(true);
    getVisitStats(rangeToMs(range)).then((data) => {
      if (active) {
        setStats(data);
        setIsFetching(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isPinVerified, range]);

  // ─── NEW: fetch event stats in parallel ───
  useEffect(() => {
    if (!isPinVerified) return;
    let active = true;
    setIsFetchingEvents(true);
    getEventStats(rangeToMs(range)).then((data) => {
      if (active) {
        setEventStats(data);
        setIsFetchingEvents(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isPinVerified, range]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PIN_SESSION_KEY, "1");
      setIsPinVerified(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Try again.");
      setPin("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 rounded bg-gray-700" />
      </div>
    );
  }

  // PIN gate
  if (!isPinVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-gray-900/50 rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={28} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Admin Access</h2>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Enter 4-digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-center text-2xl text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••"
                autoFocus
              />
              {pinError && <p className="mt-2 text-sm text-red-400">{pinError}</p>}
            </div>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  const total = stats?.totalVisits || 0;
  const unique = stats?.uniqueVisitors || 0;
  const roleMax = Math.max(1, ...Object.values(stats?.byRole || { guest: 0, student: 0, landlord: 0 }));
  const deviceMax = Math.max(1, ...Object.values(stats?.byDevice || { mobile: 0, tablet: 0, desktop: 0 }));
  const pathMax = Math.max(1, ...(stats?.topPages.map((p) => p.count) || [1]));

  // event pipeline derived
  const evUnique = eventStats?.uniqueVisitors || 0;
  const evSessions = eventStats?.sessions || 0;
  const evPages = eventStats?.pageViews || 0;
  const evPPS = eventStats?.pagesPerSession || 0;
  const evSourceMax = Math.max(1, ...(eventStats?.bySource.map((s) => s.count) || [1]));
  const evVerticalMax = Math.max(1, ...(eventStats?.byVertical.map((v) => v.count) || [1]));
  const hasEventData = eventStats && eventStats.totalEvents > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label="Back to admin"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <BarChart3 size={24} className="text-blue-400" />
                Visitor Analytics
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Who&apos;s visiting Peza and what they&apos;re looking at
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
            Live
          </span>
        </div>

        {/* Range selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(["24h", "7d", "30d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {r === "24h" ? "Last 24h" : r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All time"}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════
            NEW: PEOPLE & TRAFFIC (reads from analytics_events)
            Additive — the legacy sections remain untouched below.
           ═══════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">People & Traffic</h2>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              New
            </span>
            <span
              className="ml-1 inline-flex items-center text-gray-500 hover:text-gray-300"
              title="Counts are estimates. Anonymous visitors are identified by a per-device id that can be reset by clearing browser data."
            >
              <Info size={12} />
            </span>
          </div>

          {isFetchingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-32 bg-gray-900/50 rounded-xl border border-gray-800"
                />
              ))}
            </div>
          ) : !hasEventData ? (
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 text-center">
              <Users size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-gray-400">
                No events recorded yet in this range.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Data appears here as people start browsing Peza.
              </p>
            </div>
          ) : (
            <>
              {/* Headline row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard
                  label="Unique visitors"
                  value={evUnique.toLocaleString()}
                  icon={<Users size={18} className="text-emerald-400" />}
                  hint="Estimated individuals"
                />
                <StatCard
                  label="Sessions"
                  value={evSessions.toLocaleString()}
                  icon={<Layers size={18} className="text-cyan-400" />}
                  hint="30-min activity windows"
                />
                <StatCard
                  label="Page views"
                  value={evPages.toLocaleString()}
                  icon={<Eye size={18} className="text-blue-400" />}
                  hint="Total pages loaded"
                />
                <StatCard
                  label="Pages / session"
                  value={evPPS.toFixed(2)}
                  icon={<TrendingUp size={18} className="text-amber-400" />}
                  hint="Avg depth per session"
                />
              </div>

              {/* Source + Vertical breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sources */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-purple-400" />
                    Where they came from
                  </h3>
                  <div className="space-y-3">
                    {eventStats!.bySource.slice(0, 8).map((s) => {
                      const pct =
                        eventStats!.totalEvents > 0
                          ? (s.count / eventStats!.totalEvents) * 100
                          : 0;
                      return (
                        <div key={s.source}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-300">
                              {SOURCE_LABELS[s.source] || s.source}
                            </span>
                            <span className="text-xs text-gray-400">
                              {s.count}{" "}
                              <span className="text-gray-600">
                                ({Math.round(pct)}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${(s.count / evSourceMax) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verticals */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    Which vertical they explored
                  </h3>
                  <div className="space-y-3">
                    {eventStats!.byVertical.slice(0, 8).map((v) => {
                      const pct =
                        eventStats!.totalEvents > 0
                          ? (v.count / eventStats!.totalEvents) * 100
                          : 0;
                      return (
                        <div key={v.vertical}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-300">
                              {VERTICAL_LABELS[v.vertical] || v.vertical}
                            </span>
                            <span className="text-xs text-gray-400">
                              {v.count}{" "}
                              <span className="text-gray-600">
                                ({Math.round(pct)}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{ width: `${(v.count / evVerticalMax) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Divider ─── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-[10px] uppercase tracking-wider text-gray-600">
            Legacy pipeline
          </span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        {/* ═══════════════════════════════════════════════════════
            LEGACY SECTIONS — untouched
           ═══════════════════════════════════════════════════════ */}
        {isFetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-32 bg-gray-900/50 rounded-xl border border-gray-800" />
            ))}
          </div>
        ) : !stats || total === 0 ? (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
            <Eye size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm text-gray-400">No visits yet in this time range.</p>
            <p className="text-xs text-gray-600 mt-1">
              Once people start visiting the site, stats will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Headline KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total visits"
                value={total.toLocaleString()}
                icon={<Eye size={18} className="text-blue-400" />}
                hint={`in ${range === "all" ? "all time" : range}`}
              />
              <StatCard
                label="Unique visitors"
                value={unique.toLocaleString()}
                icon={<Users size={18} className="text-green-400" />}
                hint={`${total > 0 ? Math.round((total / unique) * 10) / 10 : 0} pages / visitor`}
              />
              <StatCard
                label="Students"
                value={stats.byRole.student.toLocaleString()}
                icon={<GraduationCap size={18} className="text-blue-400" />}
                hint={`${total > 0 ? Math.round((stats.byRole.student / total) * 100) : 0}% of traffic`}
              />
              <StatCard
                label="Guests"
                value={stats.byRole.guest.toLocaleString()}
                icon={<UserX size={18} className="text-gray-400" />}
                hint="Not signed in yet"
              />
            </div>

            {/* Role + Device breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* By role */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  Visitors by role
                </h2>
                <div className="space-y-3">
                  {(Object.keys(ROLE_META) as VisitorRole[]).map((role) => {
                    const meta = ROLE_META[role];
                    const Icon = meta.icon;
                    const count = stats.byRole[role];
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={role}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`flex items-center gap-1.5 text-xs ${meta.color}`}>
                            <Icon size={12} />
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {count} <span className="text-gray-600">({Math.round(pct)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              role === "student" ? "bg-blue-500" :
                              role === "landlord" ? "bg-green-500" :
                              "bg-gray-500"
                            }`}
                            style={{ width: `${(count / roleMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By device */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone size={16} className="text-purple-400" />
                  Visitors by device
                </h2>
                <div className="space-y-3">
                  {(Object.keys(DEVICE_META) as DeviceType[]).map((device) => {
                    const meta = DEVICE_META[device];
                    const Icon = meta.icon;
                    const count = stats.byDevice[device];
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={device}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs text-gray-300">
                            <Icon size={12} />
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {count} <span className="text-gray-600">({Math.round(pct)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              device === "mobile" ? "bg-purple-500" :
                              device === "tablet" ? "bg-pink-500" :
                              "bg-indigo-500"
                            }`}
                            style={{ width: `${(count / deviceMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top pages */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-400" />
                Top pages
              </h2>
              <div className="space-y-2">
                {stats.topPages.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-xs text-gray-500 font-mono">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-gray-300 truncate">{p.path}</span>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">{p.count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                          style={{ width: `${(p.count / pathMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                Recent activity
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {stats.recentVisits.map((v) => {
                  const meta = ROLE_META[v.role] || ROLE_META.guest;
                  const Icon = meta.icon;
                  const deviceMeta = DEVICE_META[v.device] || DEVICE_META.desktop;
                  const DeviceIcon = deviceMeta.icon;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg bg-gray-800/40 border border-gray-800 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 ${meta.color}`}>
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-200 truncate">
                            {meta.label}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono truncate">
                            {v.normalizedPath}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <DeviceIcon size={12} className="text-gray-500" />
                        <span className="text-[11px] text-gray-500">{timeAgo(v.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
    </div>
  );
}