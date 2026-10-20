// src/lib/plans.ts
import type { ProviderPlan } from "@/types/user";

export const PEZA_ADMIN_WHATSAPP = "260771319817"; // Your number without the +

export interface PlanDetails {
  id: ProviderPlan;
  name: string;
  price: number;
  limit: number;
  features: string[];
  color: string;
  icon: string;
}

export const PLANS: Record<ProviderPlan, PlanDetails> = {
  basic: {
    id: "basic",
    name: "Basic Shop",
    price: 0,
    limit: 10,
    features: ["Up to 10 active listings", "Standard support"],
    color: "bg-gray-100 text-gray-700",
    icon: "🏠",
  },
  pro: {
    id: "pro",
    name: "Pro Shop",
    price: 59.99,
    limit: 50,
    features: ["Up to 50 active listings", "Priority support", "Pro badge"],
    color: "bg-blue-100 text-blue-800",
    icon: "🚀",
  },
  full_time: {
    id: "full_time",
    name: "Full-Time Shop",
    price: 199.99,
    limit: Infinity, // Unlimited
    features: [
      "Unlimited listings",
      "Verified Shop badge",
      "Top search placement",
      "Dedicated support",
    ],
    color: "bg-amber-100 text-amber-900",
    icon: "👑",
  },
};

/**
 * Get the maximum number of active listings allowed for a plan.
 * Defaults to Basic if plan is undefined or expired.
 */
export function getPlanLimit(plan?: ProviderPlan, planExpiry?: number): number {
  // If they have a paid plan but it expired, drop them to basic
  if (plan && plan !== "basic" && planExpiry && planExpiry < Date.now()) {
    return PLANS.basic.limit;
  }
  return plan ? PLANS[plan].limit : PLANS.basic.limit;
}

/**
 * Get the effective plan (handles expired plans dropping to basic).
 */
export function getEffectivePlan(plan?: ProviderPlan, planExpiry?: number): ProviderPlan {
  if (plan && plan !== "basic" && planExpiry && planExpiry < Date.now()) {
    return "basic";
  }
  return plan || "basic";
}

/**
 * Format a price with the K currency symbol.
 */
export function formatPrice(amount: number): string {
  return `K${amount.toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate a pre-filled WhatsApp link for the provider to request an upgrade.
 * The provider sends this to the Peza Admin to pay manually.
 */
export function getUpgradeWhatsAppLink(
  userEmail: string,
  userName: string,
  targetPlan: ProviderPlan
): string {
  const plan = PLANS[targetPlan];
  const message = `Hi Peza Admin! 👋\n\nI would like to upgrade my shop to the *${plan.name}* plan (${formatPrice(plan.price)}).\n\nMy account email is: ${userEmail}\nMy name is: ${userName}\n\nPlease let me know how to proceed with the payment.`;
  return `https://wa.me/${PEZA_ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}