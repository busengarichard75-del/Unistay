"use client";

import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";
import { Product } from "@/types/product";
import { getUniversityShortLabel } from "@/lib/universityLabels";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.imageUrls?.[0] || null;
  const isSold = product.status === "sold";

  return (
    <Link
      href={`/marketplace/${product.id}`}
      className={`group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        isSold ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <ShoppingBag size={28} strokeWidth={1.5} />
          </div>
        )}
        {isSold && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-900/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            Sold
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-gray-900">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-bold text-[var(--nexora-navy)]">
          K{product.price.toLocaleString()}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-500">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{product.location}</span>
        </p>
        <p className="mt-1 text-[11px] text-[var(--nexora-primary)]">
          {getUniversityShortLabel(product.universityId)}
        </p>
      </div>
    </Link>
  );
}