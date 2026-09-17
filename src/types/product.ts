// src/types/product.ts

export type ProductCondition = "new" | "like_new" | "used" | "for_parts";
export type ProductStatus = "available" | "sold";

// ─── Boost tiers ───
export type BoostDuration = "daily" | "weekly" | "monthly";

export const BOOST_TIERS: { id: BoostDuration; label: string; amount: number; ms: number }[] = [
  { id: "daily", label: "Daily", amount: 4.99, ms: 1 * 86400000 },
  { id: "weekly", label: "Weekly", amount: 24.99, ms: 7 * 86400000 },
  { id: "monthly", label: "Monthly", amount: 49.99, ms: 30 * 86400000 },
];

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  condition: ProductCondition;
  imageUrls?: string[];
  location: string;
  universityId: string;
  latitude?: number;
  longitude?: number;
  whatsapp: string;
  status: ProductStatus;
  views: number;
  whatsappClicks: number;
  createdAt: number;
  updatedAt: number;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;

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
}

export const PRODUCT_CONDITIONS: { id: ProductCondition; label: string }[] = [
  { id: "new", label: "New" },
  { id: "like_new", label: "Like New" },
  { id: "used", label: "Used" },
  { id: "for_parts", label: "For Parts" },
];

export const PRODUCT_STATUSES: { id: ProductStatus; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "sold", label: "Sold" },
];

// ─── Boost helpers ───
export function isProductBoosted(p: Product): boolean {
  if (!p.isBoosted) return false;
  if (p.boostExpiry && p.boostExpiry < Date.now()) return false;
  return true;
}

export function getProductBoostDaysRemaining(p: Product): number {
  if (!p.isBoosted || !p.boostExpiry) return 0;
  const ms = p.boostExpiry - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

// ─── Discount helpers ───
export function isProductDiscountActive(p: Product): boolean {
  if (!p.discountPercent || p.discountPercent <= 0) return false;
  if (!p.discountExpiresAt) return false;
  return p.discountExpiresAt > Date.now();
}

export function getProductDiscountedPrice(p: Product): number | null {
  if (!isProductDiscountActive(p)) return null;
  const discounted = p.price * (1 - (p.discountPercent || 0) / 100);
  return Math.round(discounted);
}