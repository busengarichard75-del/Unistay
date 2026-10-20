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
  Sparkles,
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
    <section className="container-wide pt-8 pb-4">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30">
            <Flame size={20} fill="currentColor" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--nexora-navy)]">
              Trending on Peza
            </h2>
            <p className="text-xs font-medium text-gray-500">
              The hottest services & products right now
            </p>
          </div>
        </div>
        <Link
          href="/services"
          className="hidden items-center gap-1 text-sm font-bold text-[var(--nexora-primary)] hover:underline sm:flex"
        >
          See all <ArrowRight size={14} />
        </Link>
      </div>

      {/* Compact horizontal strip */}
      {isFetching ? (
        <StripSkeleton />
      ) : (
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.map((item) => (
            <div
              key={`${item.kind}:${item.data.id}`}
              className="w-[160px] shrink-0 snap-start sm:w-[190px]"
            >
              {item.kind === "service" ? (
                <CompactServiceCard service={item.data} />
              ) : (
                <CompactProductCard product={item.data} />
              )}
            </div>
          ))}

          {/* View more card — end of strip */}
          <div className="w-[160px] shrink-0 snap-start sm:w-[190px]">
            <ViewMoreCard />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Premium View more card ───
function ViewMoreCard() {
  return (
    <Link
      href="/services"
      className="group relative flex h-full min-h-[220px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--nexora-navy)] to-slate-900 p-4 text-center shadow-md transition-all hover:scale-[1.02] hover:shadow-xl sm:min-h-[250px]"
    >
      {/* Decorative background glow */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-[var(--nexora-primary)]/20 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative z-10 flex items-center justify-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-sm backdrop-blur-sm">
          <Wrench size={18} />
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-sm backdrop-blur-sm">
          <ShoppingBag size={18} />
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-sm font-bold text-white">Discover more</p>
        <p className="mt-1 text-[11px] leading-tight text-gray-400">
          Explore hundreds of<br />services & products
        </p>
      </div>

      <span className="relative z-10 mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[var(--nexora-navy)] shadow-sm transition-transform group-hover:translate-x-1">
        Explore
        <ArrowRight size={12} />
      </span>
    </Link>
  );
}

// ─── Compact service card (premium style) ───
function CompactServiceCard({ service }: { service: Service }) {
  const image = service.imageUrls?.[0];
  const optimized = image ? optimizeCardImage(image) : null;
  const isBoosted = isServiceBoosted(service);
  const hasDiscount = isServiceDiscountActive(service);
  const isFree = isServiceFree(service);
  const discountedPrice = getServiceDiscountedPrice(service);

  let priceLabel: React.ReactNode = null;
  
  if (isFree) {
    priceLabel = <span className="text-emerald-600 font-extrabold text-base">FREE</span>;
  } else if (service.priceType === "from" && service.priceFrom) {
    if (hasDiscount && discountedPrice !== null) {
      priceLabel = (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px] font-bold text-red-600">K</span>
            <span className="text-base font-extrabold text-red-600 leading-none">{discountedPrice.toLocaleString()}</span>
          </div>
          <span className="text-[9px] text-gray-400 line-through">K{service.priceFrom.toLocaleString()}</span>
        </div>
      );
    } else {
      priceLabel = (
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">From</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px] font-bold text-[var(--nexora-navy)]">K</span>
            <span className="text-base font-extrabold text-[var(--nexora-navy)] leading-none">{service.priceFrom.toLocaleString()}</span>
          </div>
        </div>
      );
    }
  } else if (service.priceType === "contact") {
    priceLabel = <span className="text-xs font-semibold text-gray-500">Contact</span>;
  }

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-md ${
        isBoosted ? "ring-2 ring-amber-300" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        {optimized ? (
          <img
            src={optimized}
            alt={service.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <Wrench size={24} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isFree && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              <Gift size={10} /> FREE
            </span>
          )}
          {hasDiscount && !isFree && (
            <span className="inline-flex w-fit items-center gap-0.5 rounded-full bg-red-500/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              <FlameIcon size={10} fill="currentColor" /> {service.discountPercent}% OFF
            </span>
          )}
        </div>

        {isBoosted && (
          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <Zap size={12} fill="currentColor" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-gray-900 group-hover:text-[var(--nexora-primary)] transition-colors">
          {service.title}
        </p>
        <div className="mt-2">
          {priceLabel}
        </div>
      </div>
    </Link>
  );
}

// ─── Compact product card (premium style) ───
function CompactProductCard({ product }: { product: Product }) {
  const image = product.imageUrls?.[0];
  const optimized = image ? optimizeCardImage(image) : null;
  const isBoosted = isProductBoosted(product);
  const hasDiscount = isProductDiscountActive(product);
  const discountedPrice = getProductDiscountedPrice(product);

  return (
    <Link
      href={`/marketplace/${product.id}`}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-md ${
        isBoosted ? "ring-2 ring-amber-300" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        {optimized ? (
          <img
            src={optimized}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ShoppingBag size={24} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="inline-flex w-fit items-center gap-0.5 rounded-full bg-red-500/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              <FlameIcon size={10} fill="currentColor" /> {product.discountPercent}% OFF
            </span>
          )}
        </div>

        {isBoosted && (
          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <Zap size={12} fill="currentColor" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-gray-900 group-hover:text-[var(--nexora-primary)] transition-colors">
          {product.name}
        </p>
        
        <div className="mt-2">
          {hasDiscount && discountedPrice !== null ? (
            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[10px] font-bold text-red-600">K</span>
                <span className="text-base font-extrabold text-red-600 leading-none">{discountedPrice.toLocaleString()}</span>
              </div>
              <span className="text-[9px] text-gray-400 line-through">K{product.price.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] font-bold text-[var(--nexora-navy)]">K</span>
              <span className="text-base font-extrabold text-[var(--nexora-navy)] leading-none">{product.price.toLocaleString()}</span>
            </div>
          )}
        </div>
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
    <div className="flex gap-3 overflow-x-hidden pb-4 pt-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-[160px] shrink-0 animate-pulse overflow-hidden rounded-2xl bg-white p-3 shadow-sm sm:w-[190px]"
        >
          <div className="mb-3 aspect-[4/3] w-full rounded-xl bg-gray-200" />
          <div className="mb-2 h-3.5 w-11/12 rounded bg-gray-200" />
          <div className="mb-3 h-3.5 w-2/3 rounded bg-gray-200" />
          <div className="h-5 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}