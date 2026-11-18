
"use client";

import { useState } from "react";
import { X, Check, Crown, Rocket, Home, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { ProviderPlan } from "@/types/user";
import { PLANS, getEffectivePlan, formatPrice } from "@/lib/plans";
import { PaymentModal } from "@/components/shared/PaymentModal";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: ProviderPlan;
  currentPlanExpiry?: number;
  userEmail: string;
  userName: string;
}

export function PlanUpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  currentPlanExpiry,
  userEmail,
  userName,
}: PlanUpgradeModalProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProviderPlan | null>(null);

  if (!isOpen) return null;

  const effectivePlan = getEffectivePlan(currentPlan, currentPlanExpiry);
  const isExpired = !!(
    currentPlanExpiry &&
    currentPlanExpiry < Date.now() &&
    currentPlan &&
    currentPlan !== "basic"
  );
  const planOrder: ProviderPlan[] = ["basic", "pro", "full_time"];

  const accentStyles: Record<
    ProviderPlan,
    {
      border: string;
      bg: string;
      badge: string;
      ring: string;
      iconRing: string;
      button: string;
    }
  > = {
    basic: {
      border: "border-gray-400",
      bg: "bg-gray-50/70",
      badge: "bg-gray-700 text-white",
      ring: "ring-2 ring-gray-300",
      iconRing: "ring-2 ring-gray-300",
      button: "bg-gray-800 text-white",
    },
    pro: {
      border: "border-indigo-500",
      bg: "bg-indigo-50/60",
      badge: "bg-indigo-600 text-white",
      ring: "ring-2 ring-indigo-300",
      iconRing: "ring-2 ring-indigo-400",
      button: "bg-indigo-600 text-white",
    },
    full_time: {
      border: "border-amber-400",
      bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
      badge: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
      ring: "ring-2 ring-amber-300",
      iconRing: "ring-2 ring-amber-400",
      button: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
    },
  };

  const formatExpiry = (expiry?: number) => {
    if (!expiry) return null;

    const days = Math.ceil((expiry - Date.now()) / 86400000);

    if (days <= 0) return "Expired";
    if (days === 1) return "1 day left";

    return `${days} days left`;
  };

  const handleUpgradeClick = (planId: "pro" | "full_time") => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div
          className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-gray-50 shadow-2xl sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative shrink-0 bg-gradient-to-r from-[var(--nexora-navy)] to-indigo-900 px-6 py-8 text-center text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles size={24} className="text-yellow-300" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight">
              Upgrade Your Shop
            </h2>

            <p className="mt-1 text-sm text-gray-300">
              You&apos;re on{" "}
              <span className="font-semibold text-white">
                {PLANS[effectivePlan].name}
              </span>
              {isExpired && (
                <span className="ml-1 text-amber-300">(expired)</span>
              )}
              {" · "}Choose a plan that fits your hustle.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              {planOrder.map((planId) => {
                const plan = PLANS[planId];
                const isCurrent = effectivePlan === planId && !isExpired;
                const isPro = planId === "pro";
                const accent = accentStyles[planId];
                const expiryLabel =
                  isCurrent && planId !== "basic"
                    ? formatExpiry(currentPlanExpiry)
                    : null;
                const showMostPopular = isPro && !isCurrent;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all ${
                      isCurrent
                        ? `${accent.border} ${accent.bg} ${accent.ring} shadow-lg`
                        : isPro
                          ? "border-indigo-600 shadow-indigo-500/20 shadow-lg sm:-translate-y-2"
                          : "border-gray-200"
                    }`}
                  >
                    {isCurrent && (
                      <div
                        className={`py-1 text-center text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}
                      >
                        <CheckCircle2
                          size={10}
                          className="inline -mt-0.5 mr-1"
                        />
                        Your Current Plan
                      </div>
                    )}

                    {showMostPopular && (
                      <div className="bg-indigo-600 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                        Most Popular
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${plan.color} ${
                            isCurrent ? accent.iconRing : ""
                          }`}
                        >
                          {plan.id === "basic" && <Home size={20} />}
                          {plan.id === "pro" && <Rocket size={20} />}
                          {plan.id === "full_time" && <Crown size={20} />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {plan.name}
                            </h3>

                            {isCurrent && (
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${accent.badge}`}
                              >
                                <Check size={12} />
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500">
                            {plan.limit === Infinity
                              ? "Unlimited listings"
                              : `Up to ${plan.limit} listings`}
                          </p>
                        </div>
                      </div>

                      {expiryLabel && (
                        <div
                          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            expiryLabel === "Expired"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <Clock size={11} />
                          {expiryLabel}
                        </div>
                      )}

                      <div className="mt-5 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">
                          {plan.price === 0
                            ? "Free"
                            : formatPrice(plan.price)}
                        </span>

                        {plan.price > 0 && (
                          <span className="text-sm font-medium text-gray-500">
                            /month
                          </span>
                        )}
                      </div>

                      <ul className="mt-6 flex-1 space-y-3">
                        {plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <Check
                              size={16}
                              className={`mt-0.5 shrink-0 ${
                                isCurrent
                                  ? "text-emerald-600"
                                  : "text-emerald-500"
                              }`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 border-t border-gray-100 pt-4">
                        {isCurrent ? (
                          <button
                            disabled
                            className={`w-full cursor-default rounded-xl py-3 text-sm font-bold opacity-90 ${accent.button}`}
                          >
                            <CheckCircle2
                              size={14}
                              className="inline -mt-0.5 mr-1"
                            />
                            Your Current Plan
                          </button>
                        ) : planId === "basic" ? (
                          <button
                            disabled
                            className="w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-sm font-bold text-gray-500"
                          >
                            Downgrade via Support
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpgradeClick(planId as "pro" | "full_time")
                            }
                            className={`w-full rounded-xl py-3 text-sm font-bold transition-transform active:scale-95 ${
                              isPro
                                ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                                : "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md hover:opacity-90"
                            }`}
                          >
                            Upgrade & Pay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Pay securely via Mobile Money. Your plan activates after payment
              is verified.
            </p>
          </div>
        </div>
      </div>

      {showPayment && selectedPlan && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={selectedPlan === "pro" ? 59.99 : 199.99}
          title={`Upgrade to ${PLANS[selectedPlan].name}`}
          type={
            selectedPlan === "pro"
              ? "provider_plan_pro"
              : "provider_plan_full_time"
          }
          onSuccess={() => {
            setShowPayment(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
