// src/components/provider/ShowcaseStrip.tsx
"use client";

import Link from "next/link";
import { Service, isServiceBoosted } from "@/types/service";
import { Product, isProductBoosted } from "@/types/product";
import { optimizeCardImage } from "@/lib/imageUrl";

interface ShowcaseStripProps {
  services: Service[];
  products: Product[];
  /** Optional — pinned listing from shopSettings.featuredListingId */
  featuredId?: string;
}

interface ShowcaseItem {
  key: string;
  imageUrl: string;
  href: string;
  title: string;
}

const MAX_ITEMS = 4;
const MAX_PASSES = 2; // up to 2 images from any one listing

/**
 * Showcase strip — 4 best images shown at the top of a provider profile.
 * Ranks: featured → boosted → most viewed → newest.
 * Pulls 1 image per listing per pass, so the row stays visually diverse.
 * Auto-hides when fewer than 2 images are available.
 */
export function ShowcaseStrip({
  services,
  products,
  featuredId,
}: ShowcaseStripProps) {
  const items = buildShowcase(services, products, featuredId);

  // Hide entirely if not enough content — avoids an empty-looking profile
  if (items.length < 2) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--nexora-text-primary)]">
          Featured work
        </h2>
        <span className="text-[11px] text-gray-400">
          {items.length} image{items.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-transform hover:scale-[1.02]"
            aria-label={item.title}
          >
            <img
              src={optimizeCardImage(item.imageUrl)}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Title overlay — appears on hover (desktop) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block">
              <p className="truncate text-[11px] font-medium text-white">
                {item.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Ranking + selection
// ─────────────────────────────────────────────────────────

function buildShowcase(
  services: Service[],
  products: Product[],
  featuredId?: string
): ShowcaseItem[] {
  type Ranked = {
    kind: "service" | "product";
    id: string;
    title: string;
    images: string[];
    isFeatured: boolean;
    isBoosted: boolean;
    views: number;
    createdAt: number;
  };

  const ranked: Ranked[] = [
    ...services.map((s) => ({
      kind: "service" as const,
      id: s.id,
      title: s.title,
      images: (s.imageUrls || []).filter(Boolean),
      isFeatured: s.id === featuredId,
      isBoosted: isServiceBoosted(s),
      views: s.views || 0,
      createdAt: s.createdAt || 0,
    })),
    ...products.map((p) => ({
      kind: "product" as const,
      id: p.id,
      title: p.name,
      images: (p.imageUrls || []).filter(Boolean),
      isFeatured: p.id === featuredId,
      isBoosted: isProductBoosted(p),
      views: p.views || 0,
      createdAt: p.createdAt || 0,
    })),
  ];

  // Filter out listings with zero images — they can't contribute to a showcase
  const withImages = ranked.filter((r) => r.images.length > 0);

  // Rank
  withImages.sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    if (a.views !== b.views) return b.views - a.views;
    return b.createdAt - a.createdAt;
  });

  // Pull images in passes — 1 per listing per pass, so variety wins
  const items: ShowcaseItem[] = [];
  const usedCount = new Map<string, number>();

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    for (const listing of withImages) {
      if (items.length >= MAX_ITEMS) break;

      const used = usedCount.get(listing.id) || 0;
      if (used >= listing.images.length) continue;

      items.push({
        key: `${listing.kind}_${listing.id}_${used}`,
        imageUrl: listing.images[used],
        href:
          listing.kind === "service"
            ? `/services/${listing.id}`
            : `/marketplace/${listing.id}`,
        title: listing.title,
      });

      usedCount.set(listing.id, used + 1);
    }
    if (items.length >= MAX_ITEMS) break;
  }

  return items;
}