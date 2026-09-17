"use client";

import Link from "next/link";
import { MapPin, Wrench, Zap, Flame } from "lucide-react";
import {
  Service,
  SERVICE_CATEGORIES,
  isServiceBoosted,
  isServiceDiscountActive,
  getServiceDiscountedPrice,
} from "@/types/service";
import { getUniversityShortLabel } from "@/lib/universityLabels";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const primaryImage = service.imageUrls?.[0] || null;
  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const isInactive = service.status !== "available";
  const isBoosted = isServiceBoosted(service);

  const hasDiscount = isServiceDiscountActive(service);
  const discountedPrice = getServiceDiscountedPrice(service);
  const originalPrice = service.priceFrom || null;

  // ─── Price display ───
  const showPrice = service.priceType === "from" && originalPrice;
  const priceLabel =
    service.priceType === "from" && originalPrice
      ? `From K${originalPrice.toLocaleString()}`
      : service.priceType === "contact"
      ? "Contact for price"
      : null;

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

        {/* Boost badge — icon only, stacked top-right */}
        {isBoosted && (
          <span
            className={`absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md ${
              hasDiscount ? "top-9" : "top-2"
            }`}
            title="Boosted"
          >
            <Zap size={12} fill="currentColor" />
          </span>
        )}

        {/* Discount badge */}
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
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-gray-900">
          {service.title}
        </h3>

        {/* Price row */}
        {showPrice && discountedPrice !== null ? (
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
      </div>
    </Link>
  );
}