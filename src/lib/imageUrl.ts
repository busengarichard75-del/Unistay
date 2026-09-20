// src/lib/imageUrl.ts

/**
 * Cloudinary URL optimizer.
 *
 * Cloudinary lets you transform images on-the-fly via URL params:
 *   .../upload/w_600,f_auto,q_auto/v123/abc.jpg
 *
 * w_600      → width 600px (auto height)
 * f_auto     → serve WebP/AVIF if browser supports (50-70% smaller)
 * q_auto     → automatic quality (looks identical, 60-80% smaller)
 *
 * The result: a 1MB image becomes ~40-80KB with zero visual difference.
 *
 * Non-Cloudinary URLs are returned untouched — this is safe for any URL.
 */

const CLOUDINARY_MARKER = "/image/upload/";

export type ImagePreset =
  | "thumbnail"   // 200px — tiny avatars, table thumbnails
  | "card"        // 600px — browse grid cards
  | "cardLarge"   // 800px — big cards / list view
  | "detail"      // 1200px — detail page hero
  | "hero"        // 1600px — full-width hero images
  | "og";         // 1200×630 — social share image

const PRESET_WIDTH: Record<ImagePreset, number> = {
  thumbnail: 200,
  card: 600,
  cardLarge: 800,
  detail: 1200,
  hero: 1600,
  og: 1200,
};

/**
 * Optimize a Cloudinary image URL.
 *
 * @example
 *   optimizeImage("https://res.cloudinary.com/x/image/upload/v123/a.jpg", { preset: "card" })
 *   → "https://res.cloudinary.com/x/image/upload/w_600,f_auto,q_auto/v123/a.jpg"
 *
 * Non-Cloudinary URLs pass through unchanged.
 */
export function optimizeImage(
  url: string | undefined | null,
  options?: { preset?: ImagePreset; width?: number }
): string {
  if (!url) return "";

  // Only rewrite Cloudinary URLs
  if (!url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_MARKER)) {
    return url;
  }

  // If it's already transformed (has w_ or f_auto), don't double-transform
  if (/\/upload\/[^/]*[wfq]_/.test(url)) {
    return url;
  }

  const width =
    options?.width ?? PRESET_WIDTH[options?.preset ?? "card"];

  // Insert transform between "/upload/" and the rest
  // Split the URL into: pre = "https://res.cloudinary.com/x/image/upload/"
  //                     post = "v123/abc.jpg"
  const [pre, post] = url.split(CLOUDINARY_MARKER);
  if (!pre || !post) return url;

  const transform = `w_${width},f_auto,q_auto`;
  return `${pre}${CLOUDINARY_MARKER}${transform}/${post}`;
}

/**
 * Convenience wrapper — short name for common card usage.
 */
export function optimizeCardImage(url: string | undefined | null): string {
  return optimizeImage(url, { preset: "card" });
}

/**
 * Convenience wrapper for detail-page images.
 */
export function optimizeDetailImage(url: string | undefined | null): string {
  return optimizeImage(url, { preset: "detail" });
}

/**
 * Convenience wrapper for thumbnail avatars.
 */
export function optimizeAvatar(url: string | undefined | null): string {
  return optimizeImage(url, { preset: "thumbnail" });
}