// src/lib/wishlist.ts

/**
 * Lightweight localStorage wishlist.
 * Per-device. No backend, no auth required, no Firestore writes.
 *
 * Storage shape:
 *   localStorage["peza_wishlist"] = JSON.stringify([
 *     { id: "abc123", type: "property", addedAt: 1726700000000 },
 *     { id: "svc-9",  type: "service",  addedAt: 1726700001000 },
 *     { id: "prd-4",  type: "product",  addedAt: 1726700002000 },
 *   ])
 */

export type WishlistType = "property" | "service" | "product";

export interface WishlistEntry {
  id: string;
  type: WishlistType;
  addedAt: number;
}

const STORAGE_KEY = "peza_wishlist";
const MAX_ENTRIES = 100; // safety cap
const EVENT = "peza:wishlist-changed";

// ─────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────

function read(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is WishlistEntry =>
        e &&
        typeof e.id === "string" &&
        (e.type === "property" ||
          e.type === "service" ||
          e.type === "product") &&
        typeof e.addedAt === "number"
    );
  } catch {
    return [];
  }
}

function write(entries: WishlistEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // storage full or blocked — silently ignore
  }
}

// ─────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────

/** All saved entries, most recently added first. */
export function getWishlist(): WishlistEntry[] {
  return read().sort((a, b) => b.addedAt - a.addedAt);
}

/** Is this listing saved? */
export function isWishlisted(id: string, type: WishlistType): boolean {
  return read().some((e) => e.id === id && e.type === type);
}

/**
 * Toggle save state. Returns the NEW state.
 * true  = now saved
 * false = now removed
 */
export function toggleWishlist(id: string, type: WishlistType): boolean {
  const current = read();
  const exists = current.some((e) => e.id === id && e.type === type);

  if (exists) {
    write(current.filter((e) => !(e.id === id && e.type === type)));
    return false;
  }

  write([{ id, type, addedAt: Date.now() }, ...current]);
  return true;
}

/** Remove a specific entry. */
export function removeFromWishlist(id: string, type: WishlistType): void {
  write(read().filter((e) => !(e.id === id && e.type === type)));
}

/** All IDs of a given type (useful for fast lookups). */
export function getWishlistIds(type?: WishlistType): string[] {
  const all = read();
  const filtered = type ? all.filter((e) => e.type === type) : all;
  return filtered.map((e) => e.id);
}

/** How many items saved. */
export function getWishlistCount(type?: WishlistType): number {
  return getWishlistIds(type).length;
}

/** Wipe everything (used by "clear" button if we ever add one). */
export function clearWishlist(): void {
  write([]);
}

// ─────────────────────────────────────────────────────────
// CROSS-COMPONENT SYNC
// Subscribe to changes so the heart icon updates everywhere
// when toggled in one place.
// ─────────────────────────────────────────────────────────

export function subscribeWishlist(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler); // cross-tab sync
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}