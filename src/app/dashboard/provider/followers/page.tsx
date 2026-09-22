// src/app/dashboard/provider/followers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { BackButton } from "@/components/ui/BackButton";
import { getFollowers } from "@/services/followService";
import type { Follow } from "@/types/follow";
import { Users, TrendingUp, Calendar, ChevronRight } from "lucide-react";

const DAY_MS = 86400000;

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FollowersPage() {
  const { user, isLoading } = useRequireAuth("service_provider");

  const [followers, setFollowers] = useState<Follow[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const list = await getFollowers(user.uid);
        if (active) setFollowers(list);
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  // ─── Growth stats ───
  const stats = useMemo(() => {
    const now = Date.now();
    const last7 = followers.filter((f) => now - f.createdAt < 7 * DAY_MS).length;
    const last30 = followers.filter((f) => now - f.createdAt < 30 * DAY_MS).length;
    return { total: followers.length, last7, last30 };
  }, [followers]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ─── Header ─── */}
        <div className="card-premium bg-[var(--nexora-navy)] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Followers</h1>
              <p className="mt-0.5 text-xs text-gray-300">
                People following your shop on Peza
              </p>
            </div>
          </div>
        </div>

        {/* ─── Growth stat row ─── */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatTile
            icon={Users}
            label="Total"
            value={stats.total}
            highlight
          />
          <StatTile
            icon={TrendingUp}
            label="Last 7 days"
            value={stats.last7}
          />
          <StatTile
            icon={Calendar}
            label="Last 30 days"
            value={stats.last30}
          />
        </div>

        {/* ─── List ─── */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
            All followers
            {stats.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({stats.total})
              </span>
            )}
          </h2>

          {isFetching ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                    <div className="h-2 w-1/4 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : followers.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                <Users size={28} />
              </div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                No followers yet
              </p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                When students follow your shop, they&apos;ll appear here and
                get notified about your new listings.
              </p>
              <Link
                href={`/provider/${user.uid}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
              >
                View your public shop
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {followers.map((f) => {
                const name = f.followerName?.trim() || "Peza user";
                const timeAgo = f.createdAt
                  ? formatDistanceToNow(f.createdAt, { addSuffix: true })
                  : "";
                return (
                  <Link
                    key={f.id}
                    href={`/provider/${f.followerId}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-[var(--nexora-primary)]/40 hover:bg-blue-50/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-[var(--nexora-primary)]">
                      {f.followerPhotoURL ? (
                        <img
                          src={f.followerPhotoURL}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(f.followerName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {name}
                      </p>
                      {timeAgo && (
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Followed {timeAgo}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-gray-300"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card-premium p-4 text-center ${
        highlight ? "ring-2 ring-[var(--nexora-primary)]/20" : ""
      }`}
    >
      <div
        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full ${
          highlight
            ? "bg-[var(--nexora-primary)] text-white"
            : "bg-blue-50 text-[var(--nexora-primary)]"
        }`}
      >
        <Icon size={16} />
      </div>
      <p className="text-xl font-bold text-[var(--nexora-text-primary)]">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
    </div>
  );
}