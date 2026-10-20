"use client";

import { X, Check, Crown, Rocket, Home, Sparkles } from "lucide-react";
import { ProviderPlan } from "@/types/user";
import {
  PLANS,
  getEffectivePlan,
  formatPrice,
  getUpgradeWhatsAppLink,
} from "@/lib/plans";

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
  if (!isOpen) return null;

  const effectivePlan = getEffectivePlan(currentPlan, currentPlanExpiry);

  const planOrder: ProviderPlan[] = ["basic", "pro", "full_time"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-gray-50 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
          <h2 className="text-2xl font-bold tracking-tight">Upgrade Your Shop</h2>
          <p className="mt-1 text-sm text-gray-300">
            Choose a plan that fits your hustle. Cancel anytime.
          </p>
        </div>

        {/* Plans Container - Scrollable on mobile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {planOrder.map((planId) => {
              const plan = PLANS[planId];
              const isCurrent = effectivePlan === planId;
              const isPro = planId === "pro";
              
              // WhatsApp link for upgrade
              const upgradeLink = getUpgradeWhatsAppLink(userEmail, userName, planId);

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all ${
                    isPro
                      ? "border-indigo-600 shadow-indigo-500/20 shadow-lg sm:-translate-y-2"
                      : "border-gray-200"
                  }`}
                >
                  {/* "Most Popular" badge for Pro */}
                  {isPro && (
                    <div className="bg-indigo-600 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                      Most Popular
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    {/* Plan Header */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${plan.color}`}>
                        {plan.id === "basic" && <Home size={20} />}
                        {plan.id === "pro" && <Rocket size={20} />}
                        {plan.id === "full_time" && <Crown size={20} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-xs text-gray-500">
                          {plan.limit === Infinity ? "Unlimited listings" : `Up to ${plan.limit} listings`}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm font-medium text-gray-500">/month</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mt-6 space-y-3 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <div className="mt-8 pt-4 border-t border-gray-100">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-400"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <a
                          href={upgradeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-transform active:scale-95 ${
                            isPro
                              ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                              : "bg-gray-900 text-white shadow-md hover:bg-black"
                          }`}
                        >
                          {plan.price === 0 ? "Downgrade" : "Upgrade via WhatsApp"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="mt-6 text-center text-xs text-gray-500">
            Payments are processed manually via Mobile Money. After paying on WhatsApp, your plan will be activated by our team within 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
}