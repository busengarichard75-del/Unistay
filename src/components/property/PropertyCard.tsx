"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BedDouble, MapPin, Star, Heart, Camera } from "lucide-react";
import { Property } from "@/types/property";
import { isBoosted } from "@/lib/boostService";
import { timeAgo } from "@/lib/timeUtils";
import {
  isWishlisted,
  toggleWishlist,
  subscribeWishlist,
} from "@/lib/wishlist";

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
  disableLink?: boolean;
}

const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

function getAvailabilityStatus(availableCount: number) {
  if (availableCount === 0) {
    return {
      label: "Full",
      color: "var(--nexora-danger)",
      bg: "var(--nexora-danger-bg)",
    };
  }

  if (availableCount <= 2) {
    return {
      label: `${availableCount} left`,
      color: "var(--nexora-warning)",
      bg: "var(--nexora-warning-bg)",
    };
  }

  return {
    label: `${availableCount} beds`,
    color: "var(--nexora-success)",
    bg: "var(--nexora-success-bg)",
  };
}

// ─────────────────────────────────────────────────────────
// Small reusable heart button (safe inside a Link)
// ─────────────────────────────────────────────────────────
function WishlistHeart({
  id,
  type = "property",
  size = "sm",
}: {
  id: string;
  type?: "property" | "service" | "product";
  size?: "sm" | "md";
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted(id, type));
    const unsub = subscribeWishlist(() => setSaved(isWishlisted(id, type)));
    return () => unsub();
  }, [id, type]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(id, type);
    setSaved(next);
  };

  const dims = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleToggle(e);
      }}
      className={`pointer-events-auto inline-flex ${dims} cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform active:scale-90`}
    >
      <Heart
        size={iconSize}
        className={saved ? "text-red-500" : "text-gray-700"}
        fill={saved ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </span>
  );
}

export function PropertyCard({
  property,
  compact = false,
  disableLink = false,
}: PropertyCardProps) {
  const {
    id,
    title,
    price,
    paymentPeriod,
    location,
    bedSpaces,
    imageUrl,
    imageUrls,
    createdAt,
  } = property;

  const primaryImage = imageUrls?.[0] || imageUrl || null;
  const photoCount = imageUrls?.length ?? (imageUrl ? 1 : 0);

  const availableCount = (bedSpaces ?? []).filter(
    (bed) => bed.isAvailable
  ).length;

  const periodLabel = paymentPeriod === "termly" ? "/term" : "/mo";
  const status = getAvailabilityStatus(availableCount);
  const boosted = isBoosted(property);
  const isVerified = property.verificationStatus === "approved";
  const isNew = !!createdAt && Date.now() - createdAt < NEW_THRESHOLD_MS;

  // ─── COMPACT CARD ──────────────────────────────────────────────
  if (compact) {
    const cardContent = (
      <>
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={title}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              <BedDouble size={28} strokeWidth={1.5} />
            </div>
          )}

          {/* Image bottom gradient */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent opacity-70"
          />

          {/* ❤️ Wishlist heart (top-left) */}
          <div className="absolute left-1.5 top-1.5">
            <WishlistHeart id={id} size="sm" />
          </div>

          {/* ⭐ Boosted badge (top-right) — unchanged */}
          {boosted && (
            <span
              className="pointer-events-none absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/95 text-black shadow-lg shadow-yellow-400/40 backdrop-blur-sm"
              aria-label="Boosted listing"
              title="Boosted listing"
            >
              <Star size={12} fill="currentColor" aria-hidden="true" />
            </span>
          )}

          {/* ✓ Verified badge (bottom-left) — unchanged */}
          {isVerified && (
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-600/90 px-1.5 py-1 text-[9px] font-semibold text-white shadow-sm backdrop-blur-sm">
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Verified
            </span>
          )}

          {/* NEW + 📷 photo count (bottom-right) */}
          {(isNew || photoCount > 1) && (
            <div className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1">
              {isNew && (
                <span className="rounded-full bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
                  New
                </span>
              )}
              {photoCount > 1 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm backdrop-blur-sm">
                  <Camera size={9} aria-hidden="true" />
                  {photoCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card information */}
        <div className="mt-2 min-w-0">
          {/* Title */}
          <h3
            title={title}
            className="truncate text-[13px] font-semibold leading-tight text-gray-900"
          >
            {title}
          </h3>

          {/* Location */}
          <p
            title={location}
            className="mt-1 flex min-w-0 items-center gap-0.5 truncate text-[11px] leading-tight text-gray-500"
          >
            <MapPin size={10} className="shrink-0" aria-hidden="true" />
            <span className="truncate">
              {location.split(",")[0]?.trim() || location}
            </span>
          </p>

          {/* Price + availability */}
          <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1">
            <span className="min-w-0 truncate text-[13px] font-bold leading-tight text-gray-900">
              K{price.toLocaleString()}
              <span className="ml-0.5 text-[10px] font-normal text-gray-400">
                {periodLabel}
              </span>
            </span>

            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                color: status.color,
                backgroundColor: status.bg,
              }}
            >
              <BedDouble size={9} aria-hidden="true" />
              {status.label}
            </span>
          </div>

          {/* Date Display */}
          {createdAt && (
            <div className="mt-1 text-[9px] text-gray-400">
              Listed {timeAgo(createdAt)}
            </div>
          )}
        </div>
      </>
    );

    if (disableLink) {
      return (
        <div
          className="group block min-w-0 select-none"
          aria-label={`View ${title}`}
        >
          {cardContent}
        </div>
      );
    }

    return (
      <Link
        href={`/property/${id}`}
        className="group block min-w-0 select-none"
        aria-label={`View ${title}`}
      >
        {cardContent}
      </Link>
    );
  }

  // ─── FULL CARD ──────────────────────────────────────────────
  return (
    <Link
      href={`/property/${id}`}
      className="group block rounded-2xl bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {primaryImage ? (
        <div className="relative mb-3 overflow-hidden rounded-xl">
          <img
            src={primaryImage}
            alt={title}
            loading="lazy"
            draggable={false}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* ❤️ Wishlist heart (top-left) */}
          <div className="absolute left-2 top-2">
            <WishlistHeart id={id} size="md" />
          </div>

          {/* ⭐ Boosted badge (top-right) — unchanged */}
          {boosted && (
            <span
              className="pointer-events-none absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400/95 text-black shadow-lg shadow-yellow-400/40 backdrop-blur-sm"
              aria-label="Boosted listing"
              title="Boosted listing"
            >
              <Star size={14} fill="currentColor" aria-hidden="true" />
            </span>
          )}

          {/* ✓ Verified badge (bottom-left) — unchanged */}
          {isVerified && (
            <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-1 text-xs font-medium text-white shadow-sm">
              ✓ Verified
            </span>
          )}

          {/* NEW + 📷 photo count (bottom-right) */}
          {(isNew || photoCount > 1) && (
            <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5">
              {isNew && (
                <span className="rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
                  New
                </span>
              )}
              {photoCount > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
                  <Camera size={11} aria-hidden="true" />
                  {photoCount}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
          <BedDouble size={34} strokeWidth={1.5} />
        </div>
      )}

      {/* Title */}
      <h3 className="truncate text-base font-semibold text-gray-900">{title}</h3>

      {/* Location */}
      <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500">
        <MapPin size={13} className="shrink-0" />
        <span className="truncate">{location}</span>
      </p>

      {/* Price + availability */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-gray-900">
          K{price.toLocaleString()}
          <span className="ml-0.5 text-xs font-normal text-gray-500">{periodLabel}</span>
        </span>

        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            color: status.color,
            backgroundColor: status.bg,
          }}
        >
          <BedDouble size={12} />
          {status.label}
        </span>
      </div>

      {/* Date Display */}
      {createdAt && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
          <span>📅 Listed {new Date(createdAt).toLocaleDateString()}</span>
          {property.updatedAt && property.updatedAt !== createdAt && (
            <>
              <span>•</span>
              <span>Updated {timeAgo(property.updatedAt)}</span>
            </>
          )}
        </div>
      )}
    </Link>
  );
}