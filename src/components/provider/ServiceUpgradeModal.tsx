// src/components/provider/ServiceUpgradeModal.tsx
"use client";

import { useState } from "react";
import { X, Check, Crown, Home, Sparkles, CheckCircle2, Clock, Wrench } from "lucide-react";
import { ServicePlan } from "@/types/user";
import { SERVICE_PLANS } from "@/lib/servicePlans";
import { PaymentModal } from "@/components/shared/PaymentModal";

interface ServiceUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: ServicePlan;
  currentPlanExpiry?: number | null;
  userEmail: string;
  userName: string;
}

export function ServiceUpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  currentPlanExpiry,
  userEmail,
  userName,
}: ServiceUpgradeModalProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);

  if (!isOpen) return null;

  const effectivePlan = currentPlan || "free";
  const isExpired = !!(currentPlanExpiry && currentPlanExpiry < Date.now() && currentPlan && currentPlan !== "free");
  const activePlan = isExpired ? "free" : effectivePlan;

  const planOrder: ServicePlan[] = ["free", "standard", "pro"];

  const accentStyles: Record<ServicePlan, { border: string; bg: string; badge: string; ring: string; iconRing: string; button: string; }> = {
    free: { border: "border-gray-400", bg: "bg-gray-50/70", badge: "bg-gray-700 text-white", ring: "ring-2 ring-gray-300", iconRing: "ring-2 ring-gray-300", button: "bg-gray-800 text-white" },
    standard: { border: "border-blue-500", bg: "bg-blue-50/60", badge: "bg-blue-600 text-white", ring: "ring-2 ring-blue-300", iconRing: "ring-2 ring-blue-400", button: "bg-blue-600 text-white" },
    pro: { border: "border-amber-400", bg: "bg-gradient-to-br from-amber-50 to-yellow-50", badge: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white", ring: "ring-2 ring-amber-300", iconRing: "ring-2 ring-amber-400", button: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white" },
  };

  const formatExpiry = (expiry?: number | null) => {
    if (!expiry) return null;
    const days = Math.ceil((expiry - Date.now()) / 86400000);
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const handleUpgradeClick = (planId: "standard" | "pro") => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4" onClick={onClose}>
        <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-gray-50 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
          <div className="relative shrink-0 bg-gradient-to-r from-[var(--nexora-navy)] to-indigo-900 px-6 py-8 text-center text-white">
            <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
              <X size={20} />
            </button>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Wrench size={24} className="text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Upgrade Your Service Shop</h2>
            <p className="mt-1 text-sm text-gray-300">
              You&apos;re on <span className="font-semibold text-white">{SERVICE_PLANS[activePlan].name}</span>
              {isExpired && <span className="ml-1 text-amber-300">(expired)</span>}
              {" · "}Add more services and get seen by more students.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              {planOrder.map((planId) => {
                const plan = SERVICE_PLANS[planId];
                const isCurrent = activePlan === planId && !isExpired;
                const isPro = planId === "pro";
                const accent = accentStyles[planId];
                const expiryLabel = isCurrent && planId !== "free" ? formatExpiry(currentPlanExpiry) : null;
                const showMostPopular = isPro && !isCurrent;

                return (
                  <div key={planId} className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all ${isCurrent ? `${accent.border} ${accent.bg} ${accent.ring} shadow-lg` : isPro ? "border-amber-400 shadow-amber-500/20 shadow-lg sm:-translate-y-2" : "border-gray-200"}`}>
                    {isCurrent && <div className={`py-1 text-center text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}><CheckCircle2 size={10} className="inline -mt-0.5 mr-1" />Your Current Plan</div>}
                    {showMostPopular && <div className="bg-amber-400 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-amber-950">Best Value</div>}

                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${planId === "free" ? "bg-gray-100 text-gray-600" : planId === "standard" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"} ${isCurrent ? accent.iconRing : ""}`}>
                          {planId === "free" && <Home size={20} />}
                          {planId === "standard" && <Sparkles size={20} />}
                          {planId === "pro" && <Crown size={20} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                            {isCurrent && <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${accent.badge}`}><Check size={12} /></span>}
                          </div>
                          <p className="text-xs text-gray-500">{plan.limit === Infinity ? "Unlimited services" : `${plan.limit} Active Service${plan.limit > 1 ? 's' : ''}`}</p>
                        </div>
                      </div>

                      {expiryLabel && <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${expiryLabel === "Expired" ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}><Clock size={11} />{expiryLabel}</div>}

                      <div className="mt-5 flex items-baseline gap-1"><span className="text-3xl font-extrabold text-gray-900">{plan.priceLabel}</span></div>

                      <div className="mt-8 pt-4 border-t border-gray-100">
                        {isCurrent ? (
                          <button disabled className={`w-full rounded-xl py-3 text-sm font-bold cursor-default ${accent.button} opacity-90`}><CheckCircle2 size={14} className="inline -mt-0.5 mr-1" />Your Current Plan</button>
                        ) : planId === "free" ? (
                          <button disabled className="w-full rounded-xl bg-gray-200 py-3 text-sm font-bold text-gray-500 cursor-not-allowed">Downgrade via Support</button>
                        ) : (
                          <button onClick={() => handleUpgradeClick(planId as "standard" | "pro")} className={`w-full rounded-xl py-3 text-sm font-bold transition-transform active:scale-95 ${isPro ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md hover:opacity-90" : "bg-gray-900 text-white shadow-md hover:bg-black"}`}>
                            Upgrade & Pay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs text-gray-500">Pay securely via Mobile Money. Your plan activates instantly after payment.</p>
          </div>
        </div>
      </div>

      {showPayment && selectedPlan && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={selectedPlan === "standard" ? 129.99 : 299.99}
          title={`Upgrade to ${SERVICE_PLANS[selectedPlan].name}`}
          type={selectedPlan === "standard" ? "service_plan_standard" : "service_plan_pro"}
          onSuccess={() => {
            setShowPayment(false);
            onClose();
          }}
        />
      )}
    </>
  );
}