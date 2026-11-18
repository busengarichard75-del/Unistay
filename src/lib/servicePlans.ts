// src/lib/servicePlans.ts
import { ServicePlan } from "@/types/user";

export const SERVICE_PLANS: Record<ServicePlan, { name: string; limit: number; priceLabel: string }> = {
  free: {
    name: "Starter",
    limit: 1,
    priceLabel: "Free",
  },
  standard: {
    name: "Standard Shop",
    limit: 3,
    priceLabel: "K129.99 / month",
  },
  pro: {
    name: "Pro Shop",
    limit: Infinity,
    priceLabel: "K299.99 / year",
  },
};

/**
 * Get the maximum number of services allowed for a user.
 * Defaults to 'free' (1 service) if not set or expired.
 */
export function getServicePlanLimit(plan?: ServicePlan, planExpiry?: number | null): number {
  if (plan && plan !== "free" && planExpiry && planExpiry < Date.now()) {
    return SERVICE_PLANS.free.limit;
  }
  return plan ? SERVICE_PLANS[plan].limit : SERVICE_PLANS.free.limit;
}

export function getEffectiveServicePlan(plan?: ServicePlan, planExpiry?: number | null): ServicePlan {
  if (plan && plan !== "free" && planExpiry && planExpiry < Date.now()) {
    return "free";
  }
  return plan || "free";
}