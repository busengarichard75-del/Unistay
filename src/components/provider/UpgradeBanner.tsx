"use client";

import { Sparkles, Zap, ArrowRight, Crown } from "lucide-react";
import { ProviderPlan } from "@/types/user";
import { PLANS, getEffectivePlan } from "@/lib/plans";

interface UpgradeBannerProps {
  plan?: ProviderPlan;
  planExpiry?: number;
  used: number;
  limit: number;
  onClick: () => void;
  /** If true, renders a slightly more compact version for tight spaces */
  compact?: boolean;
}

export function UpgradeBanner({
  plan,
  planExpiry,
  used,
  limit,
  onClick,
  compact = false,
}: UpgradeBannerProps) {
  const effectivePlan = getEffectivePlan(plan, planExpiry);
  const isFullTime = effectivePlan === "full_time";

  // If they are already on the highest plan, don't show the upgrade banner
  if (isFullTime) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
          <Crown size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Full-Time Shop</p>
          <p className="text-xs text-amber-700">You have unlimited listings. 👑</p>
        </div>
      </div>
    );
  }

  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = percentage >= 80;

  // Compact version (e.g., for Navbars or tight spots)
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex w-full items-center justify-between gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95 ${
          isNearLimit
            ? "bg-gradient-to-r from-orange-500 to-red-600 animate-pulse"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Zap size={14} className={isNearLimit ? "fill-white" : ""} />
          {isNearLimit ? `${limit - used} spots left!` : "Upgrade Shop"}
        </span>
        <ArrowRight size={14} />
      </button>
    );
  }

  // Full version (for Dashboard)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 shadow-lg ${
        isNearLimit
          ? "bg-gradient-to-br from-orange-500 to-red-600 text-white"
          : "bg-gradient-to-br from-indigo-600 to-purple-700 text-white"
      }`}
    >
      {/* Decorative background flare */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-300" />
            <h3 className="text-lg font-bold">
              {isNearLimit ? "You're almost full!" : "Grow your business"}
            </h3>
          </div>
          <p className="mt-1 text-sm text-white/80">
            {isNearLimit
              ? `You've used ${used} of ${limit} listings on the ${PLANS[effectivePlan].name} plan.`
              : `Upgrade to add more listings and get seen by more students.`}
          </p>
        </div>

        <button
          onClick={onClick}
          className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--nexora-navy)] shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          Upgrade Now →
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-white/90">
          <span>Current usage</span>
          <span>
            {used} / {limit === Infinity ? "∞" : limit}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? "bg-yellow-300" : "bg-emerald-400"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}