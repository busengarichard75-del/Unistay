"use client";

import Link from "next/link";
import { BedDouble, MapPin, Star } from "lucide-react";
import { Property } from "@/types/property";
import { isBoosted } from "@/lib/boostService";

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
}

function getAvailabilityStatus(availableCount: number) {
  if (availableCount === 0) {
    return { label: "Full", color: "var(--nexora-danger)", bg: "var(--nexora-danger-bg)" };
  }
  if (availableCount <= 2) {
    return { label: `${availableCount} left`, color: "var(--nexora-warning)", bg: "var(--nexora-warning-bg)" };
  }
  return { label: `${availableCount} beds`, color: "var(--nexora-success)", bg: "var(--nexora-success-bg)" };
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const { id, title, price, paymentPeriod, location, bedSpaces, imageUrl, imageUrls } = property;

  const primaryImage = imageUrls?.[0] || imageUrl || null;
  const availableCount = (bedSpaces ?? []).filter((bed) => bed.isAvailable).length;
  const periodLabel = paymentPeriod === "termly" ? "/term" : "/mo";
  const status = getAvailabilityStatus(availableCount);
  const boosted = isBoosted(property);
  const isVerified = property.verificationStatus === "approved";

  // ─── COMPACT CARD (Airbnb‑style) ────────────────────────────
  if (compact) {
    return (
      <Link href={`/property/${id}`} className="group block min-w-0 select-none" aria-label={`View ${title}`}>
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={title}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              <BedDouble size={22} strokeWidth={1.5} />
            </div>
          )}

          {/* Badges – smaller */}
          {boosted && (
            <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-white/95 px-1 py-0.5 text-[8px] font-bold text-gray-800 shadow-sm backdrop-blur-sm flex items-center gap-0.5">
              <Star size={7} fill="currentColor" /> Boost
            </span>
          )}
          {isVerified && (
            <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-blue-600/90 px-1 py-0.5 text-[8px] font-semibold text-white shadow-sm backdrop-blur-sm flex items-center gap-0.5">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Info – tiny text */}
        <div className="mt-1 min-w-0">
          <h3 title={title} className="truncate text-[10px] font-semibold leading-tight text-gray-900 sm:text-[11px]">
            {title}
          </h3>
          <p title={location} className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] text-gray-500 sm:text-[10px]">
            <MapPin size={8} className="shrink-0" />
            <span className="truncate">{location.split(",")[0]?.trim() || location}</span>
          </p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-bold text-gray-900 sm:text-[11px]">
              K{price.toLocaleString()}
              <span className="ml-0.5 text-[8px] font-normal text-gray-400">{periodLabel}</span>
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-[7px] font-medium"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              <BedDouble size={7} />
              {status.label}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // ─── FULL CARD (unchanged) ──────────────────────────────────
  return (
    <Link href={`/property/${id}`} className="group block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* (full card code here – same as before) */}
      {/* ... */}
    </Link>
  );
}