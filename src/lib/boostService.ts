import { Property } from "@/types/property";

/**
 * Check if a property is currently boosted (active and not expired)
 */
export function isBoosted(property: Property): boolean {
  if (!property.isBoosted) return false;
  if (!property.boostExpiry) return false;
  return Date.now() < property.boostExpiry;
}

/**
 * Get the remaining days of boost (returns 0 if not boosted or expired)
 */
export function getBoostDaysRemaining(property: Property): number {
  if (!isBoosted(property)) return 0;
  const expiry = property.boostExpiry!;
  const diff = expiry - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}