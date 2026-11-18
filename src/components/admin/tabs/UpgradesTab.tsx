// src/components/admin/tabs/UpgradesTab.tsx
"use client";

import { useState } from "react";
import { Crown, Rocket, Home, Search, CheckCircle2, Wrench } from "lucide-react";
import type { DirectoryUser } from "@/components/admin/types";
import { SERVICE_PLANS } from "@/lib/servicePlans";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  const handleUpgradeService = async (uid: string, plan: "free" | "standard" | "pro") => {
    if (!window.confirm(`Upgrade Service Shop to ${SERVICE_PLANS[plan].name}?`)) return;
    setBusyId(uid);
    try {
      const planExpiry = plan === "free" ? null : plan === "standard" ? Date.now() + 30 * 86400000 : Date.now() + 365 * 86400000;
      await updateDoc(doc(db, "users", uid), {
        servicePlan: plan,
        servicePlanExpiry: planExpiry,
      });
      toast.success("Service Plan updated successfully!");
    } catch {
      toast.error("Failed to update service plan.");
    } finally {
      setBusyId(null);
    }
  };

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
            const currentServicePlan = p.servicePlan || "free";
            const isExpired = p.servicePlanExpiry && p.servicePlanExpiry < Date.now() && currentServicePlan !== "free";
            const effectiveServicePlan = isExpired ? "free" : currentServicePlan;
            const serviceLimit = SERVICE_PLANS[effectiveServicePlan].limit;

            return (
              <div key={p.uid} className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {p.businessName || p.fullName || "Unknown Shop"}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      effectiveServicePlan === "pro" ? "bg-amber-900/40 text-amber-400" :
                      effectiveServicePlan === "standard" ? "bg-blue-900/40 text-blue-400" :
                      "bg-gray-800 text-gray-400"
                    }`}>
                      {SERVICE_PLANS[effectiveServicePlan].name} ({serviceLimit === Infinity ? "Unlimited" : serviceLimit} Services)
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{p.email}</p>
                  {isExpired && <p className="mt-1 text-[10px] text-red-400">Service Plan expired — reverted to Free.</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleUpgradeService(p.uid, "standard")}
                    disabled={busyId === p.uid || effectiveServicePlan === "standard"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-30"
                  >
                    <Wrench size={12} /> Standard (K129.99/mo)
                  </button>
                  <button
                    onClick={() => handleUpgradeService(p.uid, "pro")}
                    disabled={busyId === p.uid || effectiveServicePlan === "pro"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-30"
                  >
                    <Crown size={12} /> Pro (K299.99/yr)
                  </button>
                  {effectiveServicePlan !== "free" && (
                    <button
                      onClick={() => handleUpgradeService(p.uid, "free")}
                      disabled={busyId === p.uid}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-30"
                    >
                      <Home size={12} /> Free
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