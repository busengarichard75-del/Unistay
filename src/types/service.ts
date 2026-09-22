// src/types/service.ts

export type ServiceCategory =
  | "barber"
  | "printing"
  | "photography"
  | "tech"
  | "food"
  | "restaurant"
  | "groceries"
  | "transport"
  | "delivery"
  | "gym"
  | "laundry"
  | "tutoring"
  | "other";

export type ServiceStatus = "available" | "inactive";

export type AvailabilityDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type AvailabilityMode = "walk_in" | "appointment" | "both";

export interface ServiceAvailability {
  days?: AvailabilityDay[];
  from?: string;
  to?: string;
  mode?: AvailabilityMode;
  note?: string;
}

// ─── Pricing ───
// "free"    → no payment, community/volunteer service
// "from"    → starting price (requires priceFrom)
// "contact" → contact provider for pricing
export type ServicePriceType = "free" | "from" | "contact";
export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer";

// ─── Boost tiers ───
export type BoostDuration = "daily" | "weekly" | "monthly";

export const BOOST_TIERS: { id: BoostDuration; label: string; amount: number; ms: number }[] = [
  { id: "daily", label: "Daily", amount: 4.99, ms: 1 * 86400000 },
  { id: "weekly", label: "Weekly", amount: 24.99, ms: 7 * 86400000 },
  { id: "monthly", label: "Monthly", amount: 49.99, ms: 30 * 86400000 },
];

export interface Service {
  id: string;
  ownerId: string;
  title: string;
  category: ServiceCategory;
  description: string;
  imageUrls?: string[];
  location: string;
  universityId: string;
  latitude?: number;
  longitude?: number;
  whatsapp: string;
  status: ServiceStatus;
  views: number;
  whatsappClicks: number;
  createdAt: number;
  updatedAt: number;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;

  availability?: ServiceAvailability;
  priceType?: ServicePriceType;
  priceFrom?: number;
  paymentMethods?: PaymentMethod[];
  serviceArea?: string;

  /** 🌐 When true, this is an online/remote service — no physical map pin required. */
  isOnline?: boolean;

  // ─── Boost ───
  isBoosted?: boolean;
  boostedAt?: number | null;
  boostExpiry?: number | null;
  boostRequested?: boolean;
  boostRequestedAt?: number | null;
  boostRequestedDuration?: BoostDuration;
  boostRequestedAmount?: number;

  // ─── Flash deals ───
  discountPercent?: number;
  discountExpiresAt?: number;

  // ─── Reviews (additive — Reviews feature) ───
  /** Cached average rating (1.0–5.0). Undefined when ratingCount is 0. */
  ratingAvg?: number;
  /** Cached total review count. Hidden on cards when 0. */
  ratingCount?: number;
}

// ─────────────────────────────────────────────────────────
// CATEGORIES — order here = order of tabs on /services
// ─────────────────────────────────────────────────────────
export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: "food",        label: "Food",          icon: "🍲" },
  { id: "restaurant",  label: "Restaurants",   icon: "🍽️" },
  { id: "groceries",   label: "Groceries",     icon: "🛒" },
  { id: "transport",   label: "Transport",     icon: "🚌" },
  { id: "delivery",    label: "Delivery",      icon: "🛵" },
  { id: "gym",         label: "Gym & Fitness", icon: "💪" },
  { id: "barber",      label: "Barber / Beauty", icon: "💈" },
  { id: "laundry",     label: "Laundry",       icon: "🧺" },
  { id: "printing",    label: "Printing",      icon: "🖨️" },
  { id: "photography", label: "Photography",   icon: "📸" },
  { id: "tech",        label: "Tech / Repairs", icon: "🔧" },
  { id: "tutoring",    label: "Tutoring",      icon: "📚" },
  { id: "other",       label: "Other",         icon: "✨" },
];

export const AVAILABILITY_DAY_LABELS: Record<AvailabilityDay, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

export const AVAILABILITY_MODE_LABELS: Record<AvailabilityMode, string> = {
  walk_in: "Walk-in",
  appointment: "By appointment",
  both: "Walk-in & appointment",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
};

// ─── Pricing helpers ───

/** Is this service free? */
export function isServiceFree(s: Service): boolean {
  return s.priceType === "free";
}

/**
 * Human-readable price label for a service.
 * Used by cards and detail pages.
 */
export function getServicePriceLabel(s: Service): string | null {
  if (s.priceType === "free") return "FREE";
  if (s.priceType === "contact") return "Contact for price";
  if (s.priceType === "from" && s.priceFrom) {
    return `From K${s.priceFrom.toLocaleString()}`;
  }
  return null;
}

// ─── Boost helpers ───
export function isServiceBoosted(s: Service): boolean {
  if (!s.isBoosted) return false;
  if (s.boostExpiry && s.boostExpiry < Date.now()) return false;
  return true;
}

export function getServiceBoostDaysRemaining(s: Service): number {
  if (!s.isBoosted || !s.boostExpiry) return 0;
  const ms = s.boostExpiry - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

// ─── Discount helpers ───
// Free services cannot be discounted — isServiceDiscountActive returns false.
export function isServiceDiscountActive(s: Service): boolean {
  if (s.priceType === "free") return false;
  if (!s.discountPercent || s.discountPercent <= 0) return false;
  if (!s.discountExpiresAt) return false;
  return s.discountExpiresAt > Date.now();
}

export function getServiceDiscountedPrice(s: Service): number | null {
  if (!isServiceDiscountActive(s)) return null;
  if (s.priceType !== "from" || !s.priceFrom) return null;
  const discounted = s.priceFrom * (1 - (s.discountPercent || 0) / 100);
  return Math.round(discounted);
}