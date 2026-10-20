// src/components/admin/tabs/UpgradesTab.tsx
"use client";

import { useState } from "react";
import { Crown, Rocket, Home, Search, CheckCircle2 } from "lucide-react";
import type { DirectoryUser } from "@/components/admin/types";
import { PLANS } from "@/lib/plans";
import { toast } from "sonner";

interface UpgradesTabProps {
  users: DirectoryUser[];
  isFetching: boolean;
  onUpgrade: (uid: string, plan: "basic" | "pro" | "full_time") => Promise<void>;
}

export function UpgradesTab({ users, isFetching, onUpgrade }: UpgradesTabProps) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const providers = users.filter((u) => u.role === "service_provider");
  
  const filtered = providers.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.businessName || "").toLowerCase().includes(term) ||
      (p.fullName || "").toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

  async function handleUpgrade(uid: string, plan: "basic" | "pro" | "full_time") {
    if (!window.confirm(`Upgrade this user to ${PLANS[plan].name}?`)) return;
    setBusyId(uid);
    try {
      await onUpgrade(uid, plan);
      toast.success("Plan updated successfully!");
    } catch {
      toast.error("Failed to update plan.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Manage Shop Plans</h2>
          <p className="text-xs text-gray-400">Approve WhatsApp payments and upgrade providers.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search shop name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {isFetching ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
          <p className="text-sm text-gray-500">No providers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const currentPlan = p.plan || "basic";
            const isExpired = p.planExpiry && p.planExpiry < Date.now() && currentPlan !== "basic";
            const effectivePlan = isExpired ? "basic" : currentPlan;

            return (
              <div key={p.uid} className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {p.businessName || p.fullName || "Unknown Shop"}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      effectivePlan === "full_time" ? "bg-amber-900/40 text-amber-400" :
                      effectivePlan === "pro" ? "bg-blue-900/40 text-blue-400" :
                      "bg-gray-800 text-gray-400"
                    }`}>
                      {PLANS[effectivePlan].name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{p.email}</p>
                  {isExpired && <p className="mt-1 text-[10px] text-red-400">Plan expired — reverted to Basic.</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleUpgrade(p.uid, "pro")}
                    disabled={busyId === p.uid || effectivePlan === "pro"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-30"
                  >
                    <Rocket size={12} /> Pro (K59.99)
                  </button>
                  <button
                    onClick={() => handleUpgrade(p.uid, "full_time")}
                    disabled={busyId === p.uid || effectivePlan === "full_time"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-30"
                  >
                    <Crown size={12} /> Full (K199.99)
                  </button>
                  {effectivePlan !== "basic" && (
                    <button
                      onClick={() => handleUpgrade(p.uid, "basic")}
                      disabled={busyId === p.uid}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-30"
                    >
                      <Home size={12} /> Basic
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}