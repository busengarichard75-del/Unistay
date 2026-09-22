"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Wrench, Zap, Flame, Heart, Gift, Star } from "lucide-react";
import {
  Service,
  SERVICE_CATEGORIES,
  isServiceBoosted,
  isServiceDiscountActive,
  getServiceDiscountedPrice,
  isServiceFree,
} from "@/types/service";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import { optimizeCardImage } from "@/lib/imageUrl";
import {
  isWishlisted,
  toggleWishlist,
  subscribeWishlist,
} from "@/lib/wishlist";
import { FollowButton } from "@/components/follow/FollowButton";

interface ServiceCardProps {
  service: Service;
}

const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000;

function WishlistHeart({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted(id, "service"));
    const unsub = subscribeWishlist(() =>
      setSaved(isWishlisted(id, "service"))
    );
    return () => unsub();
  }, [id]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(id, "service");
    setSaved(next);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleToggle(e);
      }}
      className="pointer-events-auto inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform active:scale-90"
    >
      <Heart
        size={12}
        className={saved ? "text-red-500" : "text-gray-700"}
        fill={saved ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </span>
  );
}

export function ServiceCard({ service }: ServiceCardProps) {
  const rawImage = service.imageUrls?.[0] || null;
  const primaryImage = rawImage ? optimizeCardImage(rawImage) : null;

  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const isInactive = service.status !== "available";
  const isBoosted = isServiceBoosted(service);
  const isFree = isServiceFree(service);
  const isNew =
    !!service.createdAt && Date.now() - service.createdAt < NEW_THRESHOLD_MS;

  const hasDiscount = isServiceDiscountActive(service);
  const discountedPrice = getServiceDiscountedPrice(service);
  const originalPrice = service.priceFrom || null;

  const showFromPrice = service.priceType === "from" && originalPrice;
  const priceLabel =
    service.priceType === "from" && originalPrice
      ? `From K${originalPrice.toLocaleString()}`
      : service.priceType === "contact"
      ? "Contact for price"
      : null;

  // ─── Reviews (additive) ───
  const hasRating = (service.ratingCount ?? 0) > 0;

  // Both free + discount are impossible (discount deactivates for free),
  // but boost + free can coexist → stack the boost badge.
  const hasTopBadge = isFree || hasDiscount;

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        isInactive ? "opacity-60" : ""
      } ${isBoosted ? "ring-2 ring-amber-300" : ""}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={service.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <Wrench size={28} strokeWidth={1.5} />
          </div>
        )}

        {cat && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-700 backdrop-blur">
            {cat.icon} {cat.label}
          </span>
        )}

        {/* ⚡ Boost badge — stacked top-right */}
        {isBoosted && (
          <span
            className={`absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md ${
              hasTopBadge ? "top-9" : "top-2"
            }`}
            title="Boosted"
          >
            <Zap size={12} fill="currentColor" />
          </span>
        )}

        {/* 🎁 FREE badge — primary, top-right */}
        {isFree && !isInactive && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            <Gift size={10} />
            FREE
          </span>
        )}

        {/* 🔥 Discount badge */}
        {hasDiscount && !isInactive && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            <Flame size={10} fill="currentColor" />
            {service.discountPercent}% OFF
          </span>
        )}

        {isInactive && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-900/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            Unavailable
          </span>
        )}

        {/* ─── Bottom-right stack: Follow + Wishlist ─── */}
        <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1">
          <FollowButton
            variant="icon"
            providerId={service.ownerId}
            providerName={service.title}
          />
          <WishlistHeart id={service.id} />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {service.title}
          </h3>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>

        {/* ⭐ Rating (additive — hidden when 0) */}
        {hasRating && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-600">
            <Star size={10} className="text-amber-400" fill="currentColor" />
            <span className="font-semibold text-gray-800">
              {(service.ratingAvg ?? 0).toFixed(1)}
            </span>
            <span className="text-gray-400">
              · {service.ratingCount} review{service.ratingCount === 1 ? "" : "s"}
            </span>
          </p>
        )}

        {/* Price row */}
        {isFree ? (
          /* 🎁 Free — bold green, no numbers */
          <p className="mt-1 text-[13px] font-bold text-emerald-600">
            🎁 FREE
          </p>
        ) : showFromPrice && discountedPrice !== null ? (
          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
            <p className="text-[13px] font-bold text-red-600">
              From K{discountedPrice.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 line-through">
              K{originalPrice!.toLocaleString()}
            </p>
          </div>
        ) : priceLabel ? (
          <p
            className={`mt-1 truncate text-[12px] font-semibold ${
              service.priceType === "from"
                ? "text-[var(--nexora-navy)]"
                : "text-gray-500"
            }`}
          >
            {priceLabel}
          </p>
        ) : null}

        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-500">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{service.location}</span>
        </p>
        <p className="mt-1 text-[11px] text-[var(--nexora-primary)]">
          {getUniversityShortLabel(service.universityId)}
        </p>

        {service.createdAt && (
          <p className="mt-1 text-[10px] text-gray-400">
            Listed {timeAgo(service.createdAt)}
          </p>
        )}
      </div>
    </Link>
  );
}