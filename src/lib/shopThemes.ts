// src/lib/shopThemes.ts

/**
 * Peza Shop Themes — 6 preset accent palettes for provider shops.
 *
 * Each theme controls the shop header gradient + accent colors.
 * Providers pick ONE from a fixed list — no freeform color input.
 * This guarantees every shop still looks professional.
 *
 * Consumed by:
 *   - ShopAppearanceEditor (picker UI)
 *   - /provider/[uid] (shop page rendering)
 */

import type { ShopAccentColor } from "@/types/user";

export interface ShopTheme {
  id: ShopAccentColor;
  label: string;
  /** Tailwind gradient classes — e.g., "from-indigo-500 to-purple-600" */
  gradient: string;
  /** Optional: hex used for icon tinting or fallback */
  primaryHex: string;
  /** Small swatch preview (Tailwind bg class) */
  swatch: string;
}

export const SHOP_THEMES: ShopTheme[] = [
  {
    id: "indigo",
    label: "Indigo",
    gradient: "from-indigo-500 to-purple-600",
    primaryHex: "#6366f1",
    swatch: "bg-gradient-to-br from-indigo-500 to-purple-600",
  },
  {
    id: "emerald",
    label: "Emerald",
    gradient: "from-emerald-500 to-teal-600",
    primaryHex: "#10b981",
    swatch: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    id: "rose",
    label: "Rose",
    gradient: "from-rose-500 to-pink-600",
    primaryHex: "#f43f5e",
    swatch: "bg-gradient-to-br from-rose-500 to-pink-600",
  },
  {
    id: "amber",
    label: "Amber",
    gradient: "from-amber-500 to-orange-600",
    primaryHex: "#f59e0b",
    swatch: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    id: "cyan",
    label: "Cyan",
    gradient: "from-cyan-500 to-blue-600",
    primaryHex: "#06b6d4",
    swatch: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
  {
    id: "slate",
    label: "Slate",
    gradient: "from-slate-700 to-slate-900",
    primaryHex: "#334155",
    swatch: "bg-gradient-to-br from-slate-700 to-slate-900",
  },
];

/** Default theme used when a provider hasn't picked one yet. */
export const DEFAULT_SHOP_THEME: ShopTheme = SHOP_THEMES[0];

/**
 * Look up a theme by id — always returns a valid theme.
 * Falls back to the default if the id is unknown or missing.
 */
export function getShopTheme(id?: ShopAccentColor | null): ShopTheme {
  if (!id) return DEFAULT_SHOP_THEME;
  return SHOP_THEMES.find((t) => t.id === id) || DEFAULT_SHOP_THEME;
}

/** Maximum length for a shop tagline (enforced in the editor + on save). */
export const TAGLINE_MAX_LENGTH = 80;