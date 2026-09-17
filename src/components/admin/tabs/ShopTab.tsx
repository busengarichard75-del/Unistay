// src/components/admin/tabs/ShopTab.tsx
"use client";

import { useState } from "react";
import {
  Search,
  Store,
  Wrench,
  ShoppingBag,
  Zap,
  Users,
} from "lucide-react";
import type { DirectoryUser } from "@/components/admin/types";
import type { Service, BoostDuration } from "@/types/service";
import type { Product } from "@/types/product";

type ShopMode = "providers" | "boosts";

interface ShopTabProps {
  // ─── Providers ───
  filteredProviders: DirectoryUser[];
  providerCounts: { pending: number; approved: number; rejected: number };
  providerFilter: "pending" | "approved" | "rejected";
  onProviderFilterChange: (f: "pending" | "approved" | "rejected") => void;
  providerSearchTerm: string;
  onProviderSearchTermChange: (v: string) => void;
  isFetchingUsers: boolean;
  busyProviderId: string | null;
  onApprove: (p: DirectoryUser) => void;
  onRejectClick: (p: DirectoryUser) => void;

  // ─── Boosts ───
  boostServices: Service[];
  boostProducts: Product[];
  busyBoostId: string | null;
  onActivateBoost: (
    kind: "service" | "product",
    id: string,
    title: string,
    ownerId: string
  ) => void;
  onDeactivateBoost: (
    kind: "service" | "product",
    id: string,
    title: string
  ) => void;
}

const DURATION_LABELS: Record<BoostDuration, string> = {
  daily: "Daily · 24h",
  weekly: "Weekly · 7d",
  monthly: "Monthly · 30d",
};

export function ShopTab({
  filteredProviders,
  providerCounts,
  providerFilter,
  onProviderFilterChange,
  providerSearchTerm,
  onProviderSearchTermChange,
  isFetchingUsers,
  busyProviderId,
  onApprove,
  onRejectClick,
  boostServices,
  boostProducts,
  busyBoostId,
  onActivateBoost,
  onDeactivateBoost,
}: ShopTabProps) {
  const [mode, setMode] = useState<ShopMode>("providers");

  const pendingBoosts = [
    ...boostServices.filter((s) => s.boostRequested && !s.isBoosted),
    ...boostProducts.filter((p) => p.boostRequested && !p.isBoosted),
  ];
  const activeBoosts = [
    ...boostServices.filter((s) => s.isBoosted),
    ...boostProducts.filter((p) => p.isBoosted),
  ];

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("providers")}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === "providers"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <Users size={12} />
          Providers ({providerCounts.pending + providerCounts.approved + providerCounts.rejected})
        </button>
        <button
          onClick={() => setMode("boosts")}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === "boosts"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <Zap size={12} />
          Boosts
          {pendingBoosts.length > 0 && (
            <span className="rounded-full bg-amber-500 text-[10px] font-bold text-black px-1.5 py-0.5 ml-1">
              {pendingBoosts.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════ PROVIDERS MODE ══════════ */}
      {mode === "providers" && (
        <>
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onProviderFilterChange(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  providerFilter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({providerCounts[f]})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={providerSearchTerm}
              onChange={(e) => onProviderSearchTermChange(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
            />
          </div>

          {isFetchingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-24 rounded-xl bg-gray-800"
                />
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
              <Store size={32} className="mx-auto text-gray-700" />
              <p className="mt-2 text-sm text-gray-400">
                {providerSearchTerm
                  ? "No providers match your search."
                  : `No ${providerFilter} providers.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProviders.map((p) => {
                const isService = p.providerType !== "product";
                const Icon = isService ? Wrench : ShoppingBag;
                const typeLabel = isService ? "Service" : "Product";
                const status = p.verificationStatus || "pending";
                const busy = busyProviderId === p.uid;
                const displayName = p.businessName || p.fullName || p.email;

                return (
                  <div
                    key={p.uid}
                    className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                          isService
                            ? "bg-gradient-to-br from-cyan-500 to-teal-600"
                            : "bg-gradient-to-br from-orange-500 to-pink-600"
                        }`}
                      >
                        <Icon size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {displayName}
                          </p>
                          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                            {typeLabel}
                          </span>
                          {status === "approved" && (
                            <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-[10px] font-medium text-green-300">
                              Approved
                            </span>
                          )}
                          {status === "rejected" && (
                            <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] font-medium text-red-300">
                              Rejected
                            </span>
                          )}
                          {status === "pending" && (
                            <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="mt-1 space-y-0.5 text-xs text-gray-400">
                          <p>{p.email}</p>
                          {p.whatsapp && <p>📱 {p.whatsapp}</p>}
                          {p.university && <p>🎓 {p.university}</p>}
                        </div>

                        {status === "rejected" && p.verificationReason && (
                          <p className="mt-2 text-[11px] italic text-red-400/80">
                            Reason: {p.verificationReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {status !== "approved" && (
                      <div className="mt-3 flex gap-2 border-t border-gray-800 pt-3">
                        <button
                          onClick={() => onRejectClick(p)}
                          disabled={busy}
                          className="flex-1 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/40 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onApprove(p)}
                          disabled={busy}
                          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                        >
                          {busy ? "..." : "Approve"}
                        </button>
                      </div>
                    )}

                    {status === "approved" && (
                      <div className="mt-3 flex gap-2 border-t border-gray-800 pt-3">
                        <button
                          onClick={() => onRejectClick(p)}
                          disabled={busy}
                          className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-900/40 disabled:opacity-50"
                        >
                          Revoke approval
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════ BOOSTS MODE ══════════ */}
      {mode === "boosts" && (
        <div className="space-y-6">
          {/* Pending boost requests */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Pending Boost Requests
              </h3>
              <span className="text-xs text-gray-400">
                ({pendingBoosts.length})
              </span>
            </div>

            {pendingBoosts.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
                <p className="text-sm text-gray-500">
                  No pending boost requests.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingBoosts.map((item) => {
                  const isService = "category" in item && "title" in item;
                  const title = isService
                    ? (item as Service).title
                    : (item as Product).name;
                  const kind: "service" | "product" = isService
                    ? "service"
                    : "product";
                  const busy = busyBoostId === item.id;
                  const Icon = isService ? Wrench : ShoppingBag;

                  const duration = (item as any).boostRequestedDuration as BoostDuration | undefined;
                  const amount = (item as any).boostRequestedAmount as number | undefined;
                  const durationLabel = duration ? DURATION_LABELS[duration] : "Duration not set";
                  const amountLabel = typeof amount === "number" ? `K${amount.toFixed(2)}` : "—";

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800/50 bg-amber-900/10 p-4"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/40 text-amber-400">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.location} ·{" "}
                            {item.boostRequestedAt
                              ? `requested ${new Date(item.boostRequestedAt).toLocaleDateString()}`
                              : "just now"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                              {durationLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                              {amountLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          onActivateBoost(
                            kind,
                            item.id,
                            title,
                            item.ownerId
                          )
                        }
                        disabled={busy}
                        className="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {busy ? "..." : "⚡ Activate Boost"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active boosts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-400" fill="currentColor" />
              <h3 className="text-sm font-semibold text-white">
                Active Boosts
              </h3>
              <span className="text-xs text-gray-400">
                ({activeBoosts.length})
              </span>
            </div>

            {activeBoosts.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
                <p className="text-sm text-gray-500">No active boosts.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeBoosts.map((item) => {
                  const isService = "category" in item && "title" in item;
                  const title = isService
                    ? (item as Service).title
                    : (item as Product).name;
                  const kind: "service" | "product" = isService
                    ? "service"
                    : "product";
                  const busy = busyBoostId === item.id;
                  const Icon = isService ? Wrench : ShoppingBag;
                  const daysLeft = item.boostExpiry
                    ? Math.max(
                        0,
                        Math.ceil((item.boostExpiry - Date.now()) / 86400000)
                      )
                    : 0;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-800/40 bg-yellow-900/5 p-4"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-900/30 text-yellow-400">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white inline-flex items-center gap-2">
                            {title}
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm">
                              <Zap size={11} fill="currentColor" />
                            </span>
                            <span className="text-[10px] text-yellow-400/80 font-mono">
                              {daysLeft}d
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.location}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeactivateBoost(kind, item.id, title)}
                        disabled={busy}
                        className="shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
                      >
                        {busy ? "..." : "Remove Boost"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}