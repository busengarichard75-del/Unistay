"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BackButton } from "@/components/ui/BackButton";
import { getServiceById } from "@/services/serviceService";
import { getProductById } from "@/services/productService";
import { getPropertyById } from "@/services/propertyService";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ProductCard } from "@/components/products/ProductCard";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  getWishlist,
  subscribeWishlist,
  WishlistType,
} from "@/lib/wishlist";
import { Service } from "@/types/service";
import { Product } from "@/types/product";
import { Property } from "@/types/property";
import { Heart, Home, Wrench, ShoppingBag } from "lucide-react";

type Tab = "all" | "property" | "service" | "product";

interface SavedItem {
  type: WishlistType;
  addedAt: number;
  service?: Service;
  product?: Product;
  property?: Property;
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const entries = getWishlist();
      if (!active) return;

      if (entries.length === 0) {
        setItems([]);
        setIsFetching(false);
        return;
      }

      try {
        const results = await Promise.all(
          entries.map(async (entry): Promise<SavedItem | null> => {
            try {
              if (entry.type === "service") {
                const s = await getServiceById(entry.id);
                if (!s || s.adminHidden) return null;
                return { type: "service", addedAt: entry.addedAt, service: s };
              }
              if (entry.type === "product") {
                const p = await getProductById(entry.id);
                if (!p || p.adminHidden) return null;
                return { type: "product", addedAt: entry.addedAt, product: p };
              }
              const pr = await getPropertyById(entry.id);
              if (!pr || pr.adminHidden || pr.isActive === false) return null;
              return { type: "property", addedAt: entry.addedAt, property: pr };
            } catch {
              return null;
            }
          })
        );

        if (!active) return;
        setItems(results.filter((x): x is SavedItem => x !== null));
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };

    load();

    const unsub = subscribeWishlist(() => {
      const fresh = getWishlist();
      setItems((prev) =>
        prev.filter((it) =>
          fresh.some((e) => e.id === getItemId(it) && e.type === it.type)
        )
      );
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const counts = useMemo(() => {
    const c = { property: 0, service: 0, product: 0 };
    items.forEach((it) => {
      c[it.type]++;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((it) => it.type === activeTab);
  }, [items, activeTab]);

  const total = items.length;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-wide py-6">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
            <Heart size={22} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[var(--nexora-navy)] sm:text-2xl">
              Saved Items
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              {total === 0
                ? "Your saved listings will appear here"
                : `${total} item${total === 1 ? "" : "s"} saved on this device`}
            </p>
          </div>
        </div>

        {total > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <TabChip
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              icon="✨"
              label="All"
              count={total}
            />
            <TabChip
              active={activeTab === "property"}
              onClick={() => setActiveTab("property")}
              icon="🏠"
              label="Rooms"
              count={counts.property}
            />
            <TabChip
              active={activeTab === "service"}
              onClick={() => setActiveTab("service")}
              icon="🛠️"
              label="Services"
              count={counts.service}
            />
            <TabChip
              active={activeTab === "product"}
              onClick={() => setActiveTab("product")}
              icon="🛒"
              label="Products"
              count={counts.product}
            />
          </div>
        )}

        {isFetching ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white p-3 shadow-sm"
              >
                <div className="mb-3 aspect-square w-full rounded-xl bg-gray-200" />
                <div className="mb-2 h-3.5 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="card-premium p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <Heart size={28} />
            </div>
            <p className="text-sm font-medium text-gray-900">
              Nothing saved in this category
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Try another tab or save more items by tapping the ❤️ on any
              listing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <SavedItemRenderer key={getItemId(item)} item={item} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function getItemId(it: SavedItem): string {
  if (it.service) return it.service.id;
  if (it.product) return it.product.id;
  if (it.property) return it.property.id;
  return "";
}

function SavedItemRenderer({ item }: { item: SavedItem }) {
  if (item.service) return <ServiceCard service={item.service} />;
  if (item.product) return <ProductCard product={item.product} />;
  if (item.property) return <PropertyCard property={item.property} compact />;
  return null;
}

function TabChip({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--nexora-primary)] text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="card-premium p-10 text-center sm:p-14">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-pink-50 shadow-inner">
        <Heart size={36} className="text-rose-400" />
      </div>
      <h2 className="text-base font-bold text-gray-900 sm:text-lg">
        No saved items yet
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-500 sm:text-sm">
        Tap the ❤️ on any room, service, or product to save it here. Your
        saved items stay on this device — no sign-in required.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
        >
          <Home size={13} />
          Browse rooms
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Wrench size={13} />
          Services
        </Link>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ShoppingBag size={13} />
          Marketplace
        </Link>
      </div>
    </div>
  );
}