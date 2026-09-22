// src/types/product.ts

export type ProductCondition = "new" | "like_new" | "used" | "for_parts";
export type ProductStatus = "available" | "sold";

// ─── Product categories (curated taxonomy for tabs) ───
export type ProductCategory =
  | "phones"
  | "electronics"
  | "fashion"
  | "books"
  | "gaming"
  | "kitchen"
  | "furniture"
  | "bags"
  | "other";

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
  category: string;             // kept as string for backward compat with old listings
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

  // ─── Stock count (optional) ───
  // If unset → card shows no quantity badge (one-off sellers stay clean).
  // If 0 → card shows "Out of stock".
  // If > 0 → card shows "📦 N available" (amber if ≤3).
  quantity?: number;

  // ─── Seller snapshot (denormalized for instant card rendering) ───
  // Copied from the seller's user doc at listing time. Avoids an extra
  // Firestore read per card on browse pages.
  sellerName?: string;
  sellerBusinessName?: string;
  sellerPhotoURL?: string;

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
// CATEGORIES — order here = order of tabs on /marketplace
// ─────────────────────────────────────────────────────────
export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; icon: string }[] = [
  { id: "phones",      label: "Phones",       icon: "📱" },
  { id: "electronics", label: "Electronics",  icon: "💻" },
  { id: "fashion",     label: "Fashion",      icon: "👕" },
  { id: "books",       label: "Books",        icon: "📚" },
  { id: "gaming",      label: "Gaming",       icon: "🎮" },
  { id: "kitchen",     label: "Kitchen",      icon: "🍳" },
  { id: "furniture",   label: "Furniture",    icon: "🛋️" },
  { id: "bags",        label: "Bags",         icon: "🎒" },
  { id: "other",       label: "Other",        icon: "✨" },
];

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

// ─── Category label lookup (handles legacy/free-text categories) ───
export function getProductCategoryLabel(id: string): string {
  const found = PRODUCT_CATEGORIES.find((c) => c.id === id);
  if (found) return found.label;
  return id
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getProductCategoryIcon(id: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.icon || "🏷️";
}

// ─── Quantity helpers ───
export function getQuantityLabel(p: Product): {
  label: string;
  tone: "green" | "amber" | "red";
} | null {
  if (p.quantity === undefined || p.quantity === null) return null;
  if (p.quantity <= 0) {
    return { label: "Out of stock", tone: "red" };
  }
  if (p.quantity <= 3) {
    return { label: `Only ${p.quantity} left`, tone: "amber" };
  }
  return { label: `${p.quantity} available`, tone: "green" };
}

// ─── Seller display name helper ───
export function getProductSellerName(p: Product): string {
  return (
    p.sellerBusinessName?.trim() ||
    p.sellerName?.trim() ||
    ""
  );
}

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