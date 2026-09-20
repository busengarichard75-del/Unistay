// src/lib/filterListings.ts

import {
  Service,
  isServiceBoosted,
  isServiceDiscountActive,
  getServiceDiscountedPrice,
} from "@/types/service";
import {
  Product,
  isProductBoosted,
  isProductDiscountActive,
  getProductDiscountedPrice,
} from "@/types/product";
import { getDailySeed, seededShuffleById } from "@/lib/seededShuffle";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
export type SortOption =
  | "featured"
  | "newest"
  | "cheapest"
  | "expensive"
  | "popular"
  | "shuffle";

export interface ListingFilterState {
  category: string | null;

  // Services + Products
  priceBucket: string | null;
  condition: string | null;       // products only
  dealsOnly: boolean;
  boostedOnly: boolean;
  onlineOnly: boolean;            // services only
  hideSold: boolean;              // products only

  // Properties only
  gender: string | null;
  distance: string | null;
  amenities: string[];

  sort: SortOption;
}

export const DEFAULT_SERVICE_FILTERS: ListingFilterState = {
  category: null,
  priceBucket: null,
  condition: null,
  dealsOnly: false,
  boostedOnly: false,
  onlineOnly: false,
  hideSold: false,
  gender: null,
  distance: null,
  amenities: [],
  sort: "featured",
};

export const DEFAULT_PRODUCT_FILTERS: ListingFilterState = {
  ...DEFAULT_SERVICE_FILTERS,
  hideSold: true,
};

export const DEFAULT_PROPERTY_FILTERS: ListingFilterState = {
  ...DEFAULT_SERVICE_FILTERS,
  sort: "featured",
};

// ─────────────────────────────────────────────────────────
// PRICE BUCKETS
// ─────────────────────────────────────────────────────────
// "Free" is at the top — a category of its own, not merged with "Under K50".
export const SERVICE_PRICE_BUCKETS: { id: string; label: string; icon: string }[] = [
  { id: "free",      label: "Free",              icon: "🎁" },
  { id: "under_50",  label: "Under K50",         icon: "💸" },
  { id: "50_150",    label: "K50 – K150",        icon: "💰" },
  { id: "150_500",   label: "K150 – K500",       icon: "💎" },
  { id: "premium",   label: "Premium (K500+)",   icon: "👑" },
  { id: "contact",   label: "Contact for price", icon: "📞" },
];

export const PRODUCT_PRICE_BUCKETS: { id: string; label: string; icon: string }[] = [
  { id: "free",      label: "Free",              icon: "🎁" },
  { id: "under_100", label: "Under K100",        icon: "💸" },
  { id: "100_500",   label: "K100 – K500",       icon: "💰" },
  { id: "500_1000",  label: "K500 – K1000",      icon: "💎" },
  { id: "premium",   label: "Premium (K1000+)",  icon: "👑" },
];

export const PROPERTY_PRICE_BUCKETS: { id: string; label: string; icon: string }[] = [
  { id: "under_500",  label: "Under K500",         icon: "💸" },
  { id: "500_1000",   label: "K500 – K1000",       icon: "💰" },
  { id: "1000_2000",  label: "K1000 – K2000",      icon: "💎" },
  { id: "premium",    label: "Premium (K2000+)",   icon: "👑" },
];

export const GENDER_OPTIONS: { id: string; label: string }[] = [
  { id: "male",   label: "Male only" },
  { id: "female", label: "Female only" },
];

export const DISTANCE_OPTIONS: { id: string; label: string }[] = [
  { id: "under5",  label: "Within 5 min" },
  { id: "5to15",   label: "5 – 15 min" },
  { id: "15to30",  label: "15 – 30 min" },
  { id: "over30",  label: "30+ min" },
];

export const BASE_AMENITY_KEYS = ["electricity", "water", "security"] as const;

export const COMMON_AMENITIES: string[] = [
  "Electricity",
  "Water",
  "Security",
  "Wi-Fi",
  "Furnished",
  "Parking",
  "Kitchen",
];

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "featured",  label: "Featured" },
  { id: "newest",    label: "Newest first" },
  { id: "cheapest",  label: "Cheapest first" },
  { id: "expensive", label: "Most expensive" },
  { id: "popular",   label: "Most viewed" },
  { id: "shuffle",   label: "🎲 Shuffle" },
];

// ─────────────────────────────────────────────────────────
// INTERNAL — effective price (respects discounts + free)
// Free items return 0 so they sort to the top of "cheapest".
// ─────────────────────────────────────────────────────────
function serviceEffectivePrice(s: Service): number | null {
  // 🎁 Free services rank as 0 → cheapest first shows them at the top
  if (s.priceType === "free") return 0;
  if (s.priceType !== "from" || !s.priceFrom) return null;
  const d = getServiceDiscountedPrice(s);
  return d !== null ? d : s.priceFrom;
}

function productEffectivePrice(p: Product): number {
  const d = getProductDiscountedPrice(p);
  return d !== null ? d : p.price;
}

// ─────────────────────────────────────────────────────────
// MATCH — service price bucket
// ─────────────────────────────────────────────────────────
function matchesServicePrice(s: Service, bucket: string | null): boolean {
  if (!bucket) return true;

  if (bucket === "free") return s.priceType === "free";
  if (bucket === "contact") return s.priceType === "contact";

  // If a service is free and user filtered by a paid bucket → exclude it
  if (s.priceType === "free") return false;

  if (s.priceType !== "from" || !s.priceFrom) return false;
  const price = serviceEffectivePrice(s) ?? s.priceFrom;

  switch (bucket) {
    case "under_50": return price < 50;
    case "50_150":   return price >= 50 && price < 150;
    case "150_500":  return price >= 150 && price < 500;
    case "premium":  return price >= 500;
    default:         return true;
  }
}

// ─────────────────────────────────────────────────────────
// MATCH — product price bucket
// ─────────────────────────────────────────────────────────
function matchesProductPrice(p: Product, bucket: string | null): boolean {
  if (!bucket) return true;
  const price = productEffectivePrice(p);

  switch (bucket) {
    case "free":       return price === 0;
    case "under_100":  return price > 0 && price < 100;
    case "100_500":    return price >= 100 && price < 500;
    case "500_1000":   return price >= 500 && price < 1000;
    case "premium":    return price >= 1000;
    default:           return true;
  }
}

// ─────────────────────────────────────────────────────────
// MATCH — property price
// ─────────────────────────────────────────────────────────
function matchesPropertyPrice(price: number, bucket: string | null): boolean {
  if (!bucket) return true;
  switch (bucket) {
    case "under_500": return price < 500;
    case "500_1000":  return price >= 500 && price < 1000;
    case "1000_2000": return price >= 1000 && price < 2000;
    case "premium":   return price >= 2000;
    default:          return true;
  }
}

// ─────────────────────────────────────────────────────────
// MAIN — services
// ─────────────────────────────────────────────────────────
export function applyServiceFilters(
  services: Service[],
  keyword: string,
  universityId: string | null,
  filters: ListingFilterState
): Service[] {
  const q = keyword.toLowerCase().trim();

  const list = services.filter((s) => {
    if (s.adminHidden) return false;
    if (universityId && s.universityId !== universityId) return false;
    if (filters.category && s.category !== filters.category) return false;
    if (!matchesServicePrice(s, filters.priceBucket)) return false;
    if (filters.dealsOnly && !isServiceDiscountActive(s)) return false;
    if (filters.boostedOnly && !isServiceBoosted(s)) return false;
    if (filters.onlineOnly && !s.isOnline) return false;

    if (q) {
      const hay = `${s.title} ${s.location} ${s.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return sortServices(list, filters.sort);
}

// ─────────────────────────────────────────────────────────
// MAIN — products
// ─────────────────────────────────────────────────────────
export function applyProductFilters(
  products: Product[],
  keyword: string,
  universityId: string | null,
  filters: ListingFilterState
): Product[] {
  const q = keyword.toLowerCase().trim();

  const list = products.filter((p) => {
    if (p.adminHidden) return false;
    if (universityId && p.universityId !== universityId) return false;
    if (filters.hideSold && p.status === "sold") return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    if (!matchesProductPrice(p, filters.priceBucket)) return false;
    if (filters.dealsOnly && !isProductDiscountActive(p)) return false;
    if (filters.boostedOnly && !isProductBoosted(p)) return false;

    if (q) {
      const hay = `${p.name} ${p.location} ${p.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return sortProducts(list, filters.sort);
}

// ─────────────────────────────────────────────────────────
// PROPERTY TYPES — generic shape we read from
// ─────────────────────────────────────────────────────────
interface PropertyLike {
  id: string;
  universityId?: string;
  price?: number;
  genderPreference?: string;
  distanceBucket?: string;
  amenities?: { electricity?: boolean; water?: boolean; security?: boolean };
  additionalAmenities?: string[];
  isBoosted?: boolean;
  boostExpiry?: number | null;
  boostedAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
  views?: number;
  adminHidden?: boolean;
  isActive?: boolean;
  title?: string;
  location?: string;
}

function propertyHasAmenity(p: PropertyLike, amenity: string): boolean {
  const key = amenity.toLowerCase().trim();
  const base = p.amenities;
  if (base) {
    if (key === "electricity" && base.electricity) return true;
    if (key === "water" && base.water) return true;
    if (key === "security" && base.security) return true;
  }
  const extras = p.additionalAmenities || [];
  return extras.some((e) => e.toLowerCase().trim().includes(key));
}

// ─────────────────────────────────────────────────────────
// MAIN — properties
// ─────────────────────────────────────────────────────────
export function applyPropertyFilters<T extends PropertyLike>(
  properties: T[],
  keyword: string,
  universityId: string | null,
  filters: ListingFilterState
): T[] {
  const q = keyword.toLowerCase().trim();
  const now = Date.now();

  const list = properties.filter((p) => {
    if (p.adminHidden) return false;
    if (p.isActive === false) return false;
    if (universityId && p.universityId !== universityId) return false;

    if (filters.priceBucket && !matchesPropertyPrice(p.price ?? 0, filters.priceBucket)) {
      return false;
    }

    if (filters.gender) {
      const g = (p.genderPreference || "mixed").toLowerCase();
      if (g !== "mixed" && g !== filters.gender) return false;
    }

    if (filters.distance) {
      if ((p.distanceBucket || "") !== filters.distance) return false;
    }

    if (filters.amenities.length > 0) {
      const ok = filters.amenities.every((a) => propertyHasAmenity(p, a));
      if (!ok) return false;
    }

    if (filters.boostedOnly) {
      const isB = !!p.isBoosted && (!p.boostExpiry || p.boostExpiry > now);
      if (!isB) return false;
    }

    if (q) {
      const hay = `${p.title || ""} ${p.location || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return sortProperties(list, filters.sort);
}

// ─────────────────────────────────────────────────────────
// SORT — services
// ─────────────────────────────────────────────────────────
function sortServices(list: Service[], sort: SortOption): Service[] {
  const copy = [...list];

  switch (sort) {
    case "newest":
      return copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    case "cheapest":
      return copy.sort((a, b) => {
        const pa = serviceEffectivePrice(a);
        const pb = serviceEffectivePrice(b);
        // Contact-for-price items (null) sink to bottom.
        // Free items (0) surface to top.
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pa - pb;
      });

    case "expensive":
      return copy.sort((a, b) => {
        const pa = serviceEffectivePrice(a);
        const pb = serviceEffectivePrice(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pb - pa;
      });

    case "popular":
      return copy.sort((a, b) => (b.views || 0) - (a.views || 0));

    case "shuffle": {
      const boosted = copy
        .filter((s) => isServiceBoosted(s))
        .sort((a, b) => (b.boostedAt || 0) - (a.boostedAt || 0));
      const rest = copy.filter((s) => !isServiceBoosted(s));
      return [...boosted, ...seededShuffleById(rest, getDailySeed())];
    }

    case "featured":
    default:
      return copy.sort((a, b) => {
        const aB = isServiceBoosted(a) ? 1 : 0;
        const bB = isServiceBoosted(b) ? 1 : 0;
        if (aB !== bB) return bB - aB;
        if (aB) return (b.boostedAt || 0) - (a.boostedAt || 0);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }
}

// ─────────────────────────────────────────────────────────
// SORT — products
// ─────────────────────────────────────────────────────────
function sortProducts(list: Product[], sort: SortOption): Product[] {
  const copy = [...list];

  switch (sort) {
    case "newest":
      return copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    case "cheapest":
      return copy.sort((a, b) => productEffectivePrice(a) - productEffectivePrice(b));

    case "expensive":
      return copy.sort((a, b) => productEffectivePrice(b) - productEffectivePrice(a));

    case "popular":
      return copy.sort((a, b) => (b.views || 0) - (a.views || 0));

    case "shuffle": {
      const boosted = copy
        .filter((p) => isProductBoosted(p))
        .sort((a, b) => (b.boostedAt || 0) - (a.boostedAt || 0));
      const rest = copy.filter((p) => !isProductBoosted(p));
      return [...boosted, ...seededShuffleById(rest, getDailySeed())];
    }

    case "featured":
    default:
      return copy.sort((a, b) => {
        const aB = isProductBoosted(a) ? 1 : 0;
        const bB = isProductBoosted(b) ? 1 : 0;
        if (aB !== bB) return bB - aB;
        if (aB) return (b.boostedAt || 0) - (a.boostedAt || 0);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }
}

// ─────────────────────────────────────────────────────────
// SORT — properties (generic)
// ─────────────────────────────────────────────────────────
function sortProperties<T extends PropertyLike>(
  list: T[],
  sort: SortOption
): T[] {
  const copy = [...list];
  const now = Date.now();
  const isB = (p: T) => !!p.isBoosted && (!p.boostExpiry || p.boostExpiry > now);

  switch (sort) {
    case "newest":
      return copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    case "cheapest":
      return copy.sort((a, b) => (a.price || 0) - (b.price || 0));

    case "expensive":
      return copy.sort((a, b) => (b.price || 0) - (a.price || 0));

    case "popular":
      return copy.sort((a, b) => (b.views || 0) - (a.views || 0));

    case "shuffle": {
      const boosted = copy
        .filter(isB)
        .sort((a, b) => (b.boostedAt || 0) - (a.boostedAt || 0));
      const rest = copy.filter((p) => !isB(p));
      return [...boosted, ...seededShuffleById(rest, getDailySeed())];
    }

    case "featured":
    default:
      return copy.sort((a, b) => {
        const aB = isB(a) ? 1 : 0;
        const bB = isB(b) ? 1 : 0;
        if (aB !== bB) return bB - aB;
        if (aB) return (b.boostedAt || 0) - (a.boostedAt || 0);
        return (a.title || "").localeCompare(b.title || "");
      });
  }
}

// ─────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────
export function countActiveFilters(f: ListingFilterState): number {
  let n = 0;
  if (f.category) n++;
  if (f.priceBucket) n++;
  if (f.condition) n++;
  if (f.dealsOnly) n++;
  if (f.boostedOnly) n++;
  if (f.onlineOnly) n++;
  if (f.hideSold) n++;
  if (f.gender) n++;
  if (f.distance) n++;
  if (f.amenities.length > 0) n += f.amenities.length;
  if (f.sort !== "featured") n++;
  return n;
}

export function deriveCategories(
  items: { category: string }[]
): { id: string; label: string }[] {
  const counts = new Map<string, number>();
  items.forEach((i) => {
    if (!i.category) return;
    counts.set(i.category, (counts.get(i.category) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => ({ id, label: id }));
}