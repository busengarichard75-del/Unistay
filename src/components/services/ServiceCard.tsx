"use client";

import Link from "next/link";
import { MapPin, Wrench } from "lucide-react";
import { Service, SERVICE_CATEGORIES } from "@/types/service";
import { getUniversityShortLabel } from "@/lib/universityLabels";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const primaryImage = service.imageUrls?.[0] || null;
  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const isInactive = service.status !== "available";

  const priceLabel =
    service.priceType === "from" && service.priceFrom
      ? `From K${service.priceFrom.toLocaleString()}`
      : service.priceType === "contact"
      ? "Contact for price"
      : null;

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        isInactive ? "opacity-60" : ""
      }`}
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

        {priceLabel && (
          <p
            className={`mt-1 truncate text-[12px] font-semibold ${
              service.priceType === "from"
                ? "text-[var(--nexora-navy)]"
                : "text-gray-500"
            }`}
          >
            {priceLabel}
          </p>
        )}

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