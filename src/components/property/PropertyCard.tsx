"use client";

import Link from "next/link";
import { BedDouble, MapPin, Star } from "lucide-react";
import { Property } from "@/types/property";
import { isBoosted } from "@/lib/boostService";

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
  disableLink?: boolean;
}

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
  } = property;

  const primaryImage = imageUrls?.[0] || imageUrl || null;

  const availableCount = (bedSpaces ?? []).filter(
    (bed) => bed.isAvailable
  ).length;

  const periodLabel = paymentPeriod === "termly" ? "/term" : "/mo";
  const status = getAvailabilityStatus(availableCount);
  const boosted = isBoosted(property);
  const isVerified = property.verificationStatus === "approved";

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

          {/* Boosted badge */}
          {boosted && (
            <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-1 text-[9px] font-bold text-gray-800 shadow-sm backdrop-blur-sm">
              <Star
                size={9}
                fill="currentColor"
                aria-hidden="true"
              />
              Boost
            </span>
          )}

          {/* Verified badge */}
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
            <MapPin
              size={10}
              className="shrink-0"
              aria-hidden="true"
            />

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
        </div>
      </>
    );

    /*
     * When this card is inside an Embla carousel, the carousel
     * slide handles navigation. This removes the <Link> from
     * the touch-drag event chain.
     */
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

          {/* Boosted badge */}
          {boosted && (
            <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm">
              <Star
                size={11}
                fill="currentColor"
                aria-hidden="true"
              />
              Boost
            </span>
          )}

          {/* Verified badge */}
          {isVerified && (
            <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-1 text-xs font-medium text-white shadow-sm">
              ✓ Verified
            </span>
          )}
        </div>
      ) : (
        <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
          <BedDouble size={34} strokeWidth={1.5} />
        </div>
      )}

      {/* Title */}
      <h3 className="truncate text-base font-semibold text-gray-900">
        {title}
      </h3>

      {/* Location */}
      <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500">
        <MapPin size={13} className="shrink-0" />
        <span className="truncate">{location}</span>
      </p>

      {/* Price + availability */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-gray-900">
          K{price.toLocaleString()}

          <span className="ml-0.5 text-xs font-normal text-gray-500">
            {periodLabel}
          </span>
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
    </Link>
  );
}