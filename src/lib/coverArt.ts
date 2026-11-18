// src/lib/coverArt.ts
export interface CoverArt {
  background: string;
  hue: number;
  hue2: number;
}

const CATEGORY_HUES: Record<string, [number, number]> = {
  past_papers: [345, 15],   // reds → pinks
  notes:       [195, 235],  // blues → cyans
  summaries:   [20, 45],    // ambers → oranges
  guides:      [140, 175],  // emeralds → teals
  default:     [250, 290],  // indigo → purple
};

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Mesh gradient cover art — organic soft blobs on a dark base.
 * No patterns, no lines. Deterministic per entry.
 */
export function getCoverArt(seed: string, category: string): CoverArt {
  const h = hashString(`${seed}::${category}`);
  const [min, max] = CATEGORY_HUES[category] ?? CATEGORY_HUES.default;
  const span = Math.max(1, max - min);
  const hue = min + (h % span);
  const hue2 = (hue + 25 + (h % 40)) % 360;

  // Deterministic blob positions (percent) — never identical side-by-side
  const x1 = 12 + (h % 32);          // 12–44
  const y1 = 12 + ((h >> 4) % 36);   // 12–48
  const x2 = 54 + ((h >> 8) % 36);   // 54–90
  const y2 = 52 + ((h >> 12) % 34);  // 52–86

  const baseTop = `hsl(${hue} 42% 26%)`;
  const baseBot = `hsl(${hue} 38% 14%)`;

  const background = [
    `radial-gradient(circle at ${x1}% ${y1}%, hsl(${hue} 85% 58% / 0.9) 0%, transparent 42%)`,
    `radial-gradient(circle at ${x2}% ${y2}%, hsl(${hue2} 80% 52% / 0.85) 0%, transparent 48%)`,
    `linear-gradient(160deg, ${baseTop}, ${baseBot})`,
  ].join(", ");

  return { background, hue, hue2 };
}