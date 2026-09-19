"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, ShoppingBag, Zap, Flame, Heart, Camera } from "lucide-react";
import {
  Product,
  isProductBoosted,
  isProductDiscountActive,
  getProductDiscountedPrice,
} from "@/types/product";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import {
  isWishlisted,
  toggleWishlist,
  subscribeWishlist,
} from "@/lib/wishlist";

interface ProductCardProps {
  product: Product;
}

const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────
// Small reusable heart button (safe inside a Link)
// ─────────────────────────────────────────────────────────
function WishlistHeart({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted(id, "product"));
    const unsub = subscribeWishlist(() =>
      setSaved(isWishlisted(id, "product"))
    );
    return () => unsub();
  }, [id]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(id, "product");
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

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.imageUrls?.[0] || null;
  const photoCount = product.imageUrls?.length ?? 0;

  const isSold = product.status === "sold";
  const isBoosted = isProductBoosted(product);
  const hasDiscount = isProductDiscountActive(product);
  const discountedPrice = getProductDiscountedPrice(product);
  const isNew =
    !!product.createdAt && Date.now() - product.createdAt < NEW_THRESHOLD_MS;

  return (
    <Link
      href={`/marketplace/${product.id}`}
      className={`group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        isSold ? "opacity-60" : ""
      } ${isBoosted ? "ring-2 ring-amber-300" : ""}`}
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

        {/* ❤️ Wishlist heart (top-left) */}
        <div className="absolute left-2 top-2">
          <WishlistHeart id={product.id} />
        </div>

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
        {hasDiscount && !isSold && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            <Flame size={10} fill="currentColor" />
            {product.discountPercent}% OFF
          </span>
        )}

        {isSold && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-900/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            Sold
          </span>
        )}

        {/* 📷 Photo count (bottom-right) */}
        {photoCount > 1 && (
          <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
            <Camera size={10} aria-hidden="true" />
            {photoCount}
          </span>
        )}
      </div>

      <div className="p-3">
        {/* Title row with NEW badge */}
        <div className="flex items-start gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {product.name}
          </h3>
          {isNew && (
            <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>

        {/* Price row */}
        {hasDiscount && discountedPrice !== null ? (
          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
            <p className="text-[14px] font-bold text-red-600">
              K{discountedPrice.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 line-through">
              K{product.price.toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="mt-1 text-sm font-bold text-[var(--nexora-navy)]">
            K{product.price.toLocaleString()}
          </p>
        )}

        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-500">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{product.location}</span>
        </p>
        <p className="mt-1 text-[11px] text-[var(--nexora-primary)]">
          {getUniversityShortLabel(product.universityId)}
        </p>

        {/* Listed time */}
        {product.createdAt && (
          <p className="mt-1 text-[10px] text-gray-400">
            Listed {timeAgo(product.createdAt)}
          </p>
        )}
      </div>
    </Link>
  );
}