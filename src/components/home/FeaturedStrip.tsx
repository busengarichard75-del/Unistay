"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  Flame as FlameIcon,
  Gift,
  Wrench,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { getAllServices } from "@/services/serviceService";
import { getAllProducts } from "@/services/productService";
import {
  Service,
  isServiceBoosted,
  isServiceDiscountActive,
  getServiceDiscountedPrice,
  isServiceFree,
} from "@/types/service";
import {
  Product,
  isProductBoosted,
  isProductDiscountActive,
  getProductDiscountedPrice,
} from "@/types/product";
import { optimizeCardImage } from "@/lib/imageUrl";
import { getDailySeed, seededShuffleById } from "@/lib/seededShuffle";

type StripItem =
  | { kind: "service"; data: Service }
  | { kind: "product"; data: Product };

const STRIP_LIMIT = 8;
const PER_TYPE_LIMIT = 4;

export function FeaturedStrip() {
  const [items, setItems] = useState<StripItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [services, products] = await Promise.all([
          getAllServices(),
          getAllProducts(),
        ]);
        if (!active) return;

        const rankedServices = rankServices(services).slice(0, PER_TYPE_LIMIT);
        const rankedProducts = rankProducts(products).slice(0, PER_TYPE_LIMIT);

        const mixed: StripItem[] = [];
        const max = Math.max(rankedServices.length, rankedProducts.length);
        for (let i = 0; i < max; i++) {
          if (rankedServices[i]) {
            mixed.push({ kind: "service", data: rankedServices[i] });
          }
          if (rankedProducts[i]) {
            mixed.push({ kind: "product", data: rankedProducts[i] });
          }
        }

        setItems(mixed.slice(0, STRIP_LIMIT));
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!isFetching && items.length === 0) return null;

  return (
    <section className="container-wide pt-6">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30">
          <Flame size={16} fill="currentColor" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-[var(--nexora-navy)] sm:text-lg">
            Trending on Peza
          </h2>
          <p className="text-[11px] text-gray-500">
            Popular services &amp; products right now
          </p>
        </div>
        <Link
          href="/services"
          className="shrink-0 text-[11px] font-semibold text-[var(--nexora-primary)] hover:underline"
        >
          See all →
        </Link>
      </div>

      {/* Compact horizontal strip */}
      {isFetching ? (
        <StripSkeleton />
      ) : (
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.map((item) => (
            <div
              key={`${item.kind}:${item.data.id}`}
              className="w-[135px] shrink-0 sm:w-[150px]"
            >
              {item.kind === "service" ? (
                <CompactServiceCard service={item.data} />
              ) : (
                <CompactProductCard product={item.data} />
              )}
            </div>
          ))}

          {/* View more card — end of strip */}
          <div className="w-[135px] shrink-0 sm:w-[150px]">
            <ViewMoreCard />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── View more card (last card in the strip) ───
function ViewMoreCard() {
  return (
    <Link
      href="/services"
      className="group flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--nexora-primary)]/40 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 text-center transition-all hover:border-[var(--nexora-primary)] hover:shadow-md sm:min-h-[200px]"
      aria-label="View more listings on Peza"
    >
      <div className="flex items-center justify-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <Wrench size={13} />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-sm">
          <ShoppingBag size={13} />
        </span>
      </div>

      <div>
        <p className="text-[11px] font-bold text-[var(--nexora-navy)]">
          View more
        </p>
        <p className="mt-0.5 text-[10px] leading-tight text-gray-500">
          Services &amp; products
        </p>
      </div>

      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--nexora-primary)] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition-transform group-hover:translate-x-0.5">
        Explore
        <ArrowRight size={10} />
      </span>
    </Link>
  );
}

// ─── Compact service card (strip only) ───
function CompactServiceCard({ service }: { service: Service }) {
  const image = service.imageUrls?.[0];
  const optimized = image ? optimizeCardImage(image) : null;
  const isBoosted = isServiceBoosted(service);
  const hasDiscount = isServiceDiscountActive(service);
  const isFree = isServiceFree(service);
  const discountedPrice = getServiceDiscountedPrice(service);

  let priceLabel: string | null = null;
  if (isFree) priceLabel = "FREE";
  else if (service.priceType === "from" && service.priceFrom) {
    if (hasDiscount && discountedPrice !== null) {
      priceLabel = `K${discountedPrice.toLocaleString()}`;
    } else {
      priceLabel = `From K${service.priceFrom.toLocaleString()}`;
    }
  } else if (service.priceType === "contact") {
    priceLabel = "Contact";
  }

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        isBoosted ? "ring-2 ring-amber-300" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {optimized ? (
          <img
            src={optimized}
            alt={service.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-300">
            No image
          </div>
        )}

        {isBoosted && (
          <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm">
            <Zap size={10} fill="currentColor" />
          </span>
        )}

        {hasDiscount && !isFree && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
            <FlameIcon size={8} fill="currentColor" />
            {service.discountPercent}%
          </span>
        )}

        {isFree && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
            <Gift size={8} />
            FREE
          </span>
        )}
      </div>

      <div className="p-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-gray-900">
          {service.title}
        </p>
        {priceLabel && (
          <p
            className={`mt-1 truncate text-[11px] font-bold ${
              isFree
                ? "text-emerald-600"
                : hasDiscount
                ? "text-red-600"
                : "text-[var(--nexora-navy)]"
            }`}
          >
            {priceLabel}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Compact product card (strip only) ───
function CompactProductCard({ product }: { product: Product }) {
  const image = product.imageUrls?.[0];
  const optimized = image ? optimizeCardImage(image) : null;
  const isBoosted = isProductBoosted(product);
  const hasDiscount = isProductDiscountActive(product);
  const discountedPrice = getProductDiscountedPrice(product);

  const priceLabel =
    hasDiscount && discountedPrice !== null
      ? `K${discountedPrice.toLocaleString()}`
      : `K${product.price.toLocaleString()}`;

  return (
    <Link
      href={`/marketplace/${product.id}`}
      className={`group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        isBoosted ? "ring-2 ring-amber-300" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {optimized ? (
          <img
            src={optimized}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-300">
            No image
          </div>
        )}

        {isBoosted && (
          <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm">
            <Zap size={10} fill="currentColor" />
          </span>
        )}

        {hasDiscount && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
            <FlameIcon size={8} fill="currentColor" />
            {product.discountPercent}%
          </span>
        )}
      </div>

      <div className="p-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-gray-900">
          {product.name}
        </p>
        <p
          className={`mt-1 truncate text-[11px] font-bold ${
            hasDiscount ? "text-red-600" : "text-[var(--nexora-navy)]"
          }`}
        >
          {priceLabel}
        </p>
      </div>
    </Link>
  );
}

// ─── Ranking (boosted pinned, rest rotate daily) ───
function rankServices(services: Service[]): Service[] {
  const available = services.filter(
    (s) => !s.adminHidden && s.status === "available"
  );

  const boosted = available
    .filter((s) => isServiceBoosted(s))
    .sort((a, b) => {
      const aV = a.views || 0;
      const bV = b.views || 0;
      if (aV !== bV) return bV - aV;
      return (b.boostedAt || 0) - (a.boostedAt || 0);
    });

  const rest = available.filter((s) => !isServiceBoosted(s));
  const shuffled = seededShuffleById(rest, `services-${getDailySeed()}`);

  return [...boosted, ...shuffled];
}

function rankProducts(products: Product[]): Product[] {
  const available = products.filter(
    (p) => !p.adminHidden && p.status === "available"
  );

  const boosted = available
    .filter((p) => isProductBoosted(p))
    .sort((a, b) => {
      const aV = a.views || 0;
      const bV = b.views || 0;
      if (aV !== bV) return bV - aV;
      return (b.boostedAt || 0) - (a.boostedAt || 0);
    });

  const rest = available.filter((p) => !isProductBoosted(p));
  const shuffled = seededShuffleById(rest, `products-${getDailySeed()}`);

  return [...boosted, ...shuffled];
}

function StripSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-hidden pb-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="w-[135px] shrink-0 animate-pulse rounded-xl bg-white p-2 shadow-sm sm:w-[150px]"
        >
          <div className="mb-2 aspect-square w-full rounded-lg bg-gray-200" />
          <div className="mb-1.5 h-3 w-4/5 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}