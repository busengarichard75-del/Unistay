// src/lib/seededShuffle.ts

/**
 * Deterministic daily shuffle.
 *
 * Same input + same day = same output order.
 * The list reshuffles automatically at midnight (local time).
 *
 * Purpose: give unboosted listings fair rotation across days without
 * changing the order every refresh (which would be jarring for users).
 *
 * Boosted listings are NOT shuffled — they always sit at the top.
 * Call this AFTER you've sorted/pinned boosted items.
 */

/** Today's seed — YYYY-MM-DD in the user's local timezone. */
export function getDailySeed(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Small non-crypto hash — deterministic, fast, good distribution. */
function hashString(str: string): number {
  let h = 2166136261; // FNV offset
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619); // FNV prime
  }
  return h >>> 0; // unsigned 32-bit
}

/**
 * Shuffle an array deterministically using a seed string.
 * Non-mutating — returns a new array.
 */
export function seededShuffle<T>(list: T[], seed: string): T[] {
  return [...list]
    .map((item, index) => {
      // hash of (seed + item index) so duplicates still shuffle distinctly
      const key = `${seed}:${index}:${JSON.stringify(item)}`;
      return { item, sortKey: hashString(key) };
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item);
}

/**
 * Convenience — shuffle by the object's `id` field so the same item
 * keeps the same relative position across calls even if list length changes.
 * (Better than index-based shuffle when the source data grows/shrinks.)
 */
export function seededShuffleById<T extends { id: string }>(
  list: T[],
  seed: string
): T[] {
  return [...list]
    .map((item) => ({
      item,
      sortKey: hashString(`${seed}:${item.id}`),
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item);
}

/**
 * Shuffle only the "non-pinned" tail of a list.
 *
 * Usage pattern:
 *   const pinned = list.filter(isBoosted);
 *   const rest   = list.filter(x => !isBoosted(x));
 *   return [...pinned, ...shuffleTail(rest)];
 *
 * This gives you: boosted always first, unboosted fairly rotated.
 */
export function shuffleTail<T>(
  list: T[],
  isPinned: (item: T) => boolean,
  seed?: string
): T[] {
  const s = seed ?? getDailySeed();
  const pinned = list.filter(isPinned);
  const rest = list.filter((x) => !isPinned(x));
  return [...pinned, ...seededShuffleById(rest as any, s) as T[]];
}