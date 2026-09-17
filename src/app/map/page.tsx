"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import type { MapMarker, MapFilter } from "@/components/map/PezaMap";
import { getAllProperties } from "@/services/propertyService";
import { getAllServices } from "@/services/serviceService";
import { getAllProducts } from "@/services/productService";
import type { Property } from "@/types/property";
import type { Service } from "@/types/service";
import type { Product } from "@/types/product";
import { Home, Wrench, ShoppingBag, Layers, Navigation } from "lucide-react";

const PezaMap = dynamic(
  () => import("@/components/map/PezaMap").then((mod) => mod.PezaMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-2xl bg-gray-200"
        style={{ height: "min(70vh, 700px)" }}
      />
    ),
  }
);

const FILTERS: { id: MapFilter; label: string; icon: typeof Layers }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "properties", label: "Rooms", icon: Home },
  { id: "services", label: "Services", icon: Wrench },
  { id: "products", label: "Products", icon: ShoppingBag },
];

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState<MapFilter>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, pr] = await Promise.all([
          getAllProperties(),
          getAllServices(),
          getAllProducts(),
        ]);
        setProperties(p.filter((x) => x.isActive !== false));
        setServices(s.filter((x) => !x.adminHidden));
        setProducts(pr.filter((x) => !x.adminHidden));
      } catch {
        // silent
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, []);

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    properties.forEach((p) =>
      typeof p.latitude === "number" && typeof p.longitude === "number" && list.push({ kind: "property", data: p })
    );
    services.forEach((s) =>
      !s.isOnline && typeof s.latitude === "number" && typeof s.longitude === "number" && list.push({ kind: "service", data: s })
    );
    products.forEach((p) =>
      typeof p.latitude === "number" && typeof p.longitude === "number" && list.push({ kind: "product", data: p })
    );
    return list;
  }, [properties, services, products]);

  const counts = useMemo(() => {
    let room = 0, svc = 0, prod = 0;
    markers.forEach((m) => {
      if (m.kind === "property") room++;
      else if (m.kind === "service") svc++;
      else prod++;
    });
    return { room, svc, prod, total: markers.length };
  }, [markers]);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-wide py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">
            🗺️ Peza Map
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Everything near you — rooms, services, and products on one map.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filter === f.id;
            const count =
              f.id === "all"
                ? counts.total
                : f.id === "properties"
                ? counts.room
                : f.id === "services"
                ? counts.svc
                : counts.prod;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[var(--nexora-primary)] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon size={12} />
                {f.label}
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Map */}
        {isFetching ? (
          <div
            className="animate-pulse rounded-2xl bg-gray-200"
            style={{ height: "600px" }}
          />
        ) : markers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
              <Layers size={28} />
            </div>
            <p className="text-sm font-medium text-gray-800">
              No locations to show yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Listings with a map location will appear here.
            </p>
          </div>
        ) : (
          <PezaMap
            markers={markers}
            filter={filter}
            height="min(70vh, 700px)"
            showUserLocation={true}
          />
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[#4A90D9]"></span>
            Rooms
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[#0EA5E9]"></span>
            Services
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[#F97316]"></span>
            Products
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[#3B82F6] border-2 border-white shadow"></span>
            You
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-400">
            <Navigation size={11} />
            Tap a pin to preview · Tap &quot;Find my location&quot; to center on you
          </span>
        </div>
      </div>

      <Footer />
    </main>
  );
}