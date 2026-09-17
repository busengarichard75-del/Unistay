"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getPublicUserProfile, PublicUserProfile } from "@/services/userService";
import { getServicesByOwner } from "@/services/serviceService";
import { getProductsByOwner } from "@/services/productService";
import { Service, isServiceBoosted } from "@/types/service";
import { Product, isProductBoosted } from "@/types/product";
import { getUniversityFullName } from "@/lib/universityLabels";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ProductCard } from "@/components/products/ProductCard";
import {
  ArrowLeft,
  ShieldCheck,
  Wrench,
  ShoppingBag,
  MapPin,
  Calendar,
  Store,
  AlertTriangle,
} from "lucide-react";

export default function ProviderProfilePage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const uid = params?.uid;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  useEffect(() => {
    if (!uid) return;
    let active = true;
    const load = async () => {
      try {
        const p = await getPublicUserProfile(uid);
        if (!active) return;
        if (!p) {
          setNotFound(true);
          return;
        }
        setProfile(p);

        const [s, pr] = await Promise.all([
          getServicesByOwner(uid),
          getProductsByOwner(uid),
        ]);
        if (!active) return;

        setServices(s.filter((x) => !x.adminHidden));
        setProducts(pr.filter((x) => !x.adminHidden));

        // Pick default tab based on what's available
        const hasS = s.filter((x) => !x.adminHidden).length > 0;
        const hasP = pr.filter((x) => !x.adminHidden).length > 0;
        if (!hasS && hasP) setActiveTab("products");
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [uid]);

  if (isFetching) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-wide py-10">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="h-24 w-full rounded-2xl bg-gray-200" />
            <div className="h-40 w-full rounded-2xl bg-gray-200" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={28} />
          </div>
          <p className="text-sm font-medium text-gray-800">Provider not found</p>
          <p className="mt-1 text-xs text-gray-500">
            This profile doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/services")}
            className="mt-4 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            ← Back to Services
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  // ─── Sort: boosted first, then newest ───
  const sortedServices = [...services].sort((a, b) => {
    const aB = isServiceBoosted(a) ? 1 : 0;
    const bB = isServiceBoosted(b) ? 1 : 0;
    if (aB !== bB) return bB - aB;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  const sortedProducts = [...products].sort((a, b) => {
    const aB = isProductBoosted(a) ? 1 : 0;
    const bB = isProductBoosted(b) ? 1 : 0;
    if (aB !== bB) return bB - aB;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const displayName = profile.displayName;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const isProductSeller = profile.providerType === "product";
  const providerLabel = isProductSeller ? "Product Seller" : "Service Provider";
  const uniName = profile.university
    ? getUniversityFullName(profile.university)
    : "Zambia";

  const hasServices = sortedServices.length > 0;
  const hasProducts = sortedProducts.length > 0;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-wide py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* ─── Provider header card ─── */}
        <div className="card-premium overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--nexora-navy)] to-[var(--nexora-primary)] px-6 py-8 text-white">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white shadow-lg backdrop-blur">
                {initials || "PZ"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold sm:text-2xl">
                    {displayName}
                  </h1>
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                      <ShieldCheck size={11} />
                      Verified
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85">
                  <span className="inline-flex items-center gap-1">
                    <Store size={12} />
                    {providerLabel}
                  </span>
                  {profile.university && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {uniName}
                    </span>
                  )}
                  {profile.memberSince && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      Since {new Date(profile.memberSince).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Stats strip ─── */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 bg-white">
            <button
              onClick={() => setActiveTab("services")}
              disabled={!hasServices}
              className={`flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                activeTab === "services"
                  ? "bg-blue-50/50 text-[var(--nexora-navy)]"
                  : "text-gray-500 hover:bg-gray-50"
              } ${!hasServices ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Wrench size={14} />
              Services
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold shadow-sm">
                {sortedServices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              disabled={!hasProducts}
              className={`flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                activeTab === "products"
                  ? "bg-orange-50/50 text-[var(--nexora-navy)]"
                  : "text-gray-500 hover:bg-gray-50"
              } ${!hasProducts ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <ShoppingBag size={14} />
              Products
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold shadow-sm">
                {sortedProducts.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─── Listings ─── */}
        <div className="mt-6">
          {activeTab === "services" && hasServices && (
            <>
              <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
                Services
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({sortedServices.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {sortedServices.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </>
          )}

          {activeTab === "products" && hasProducts && (
            <>
              <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
                Products
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({sortedProducts.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {sortedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!hasServices && !hasProducts && (
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                <Store size={28} />
              </div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                No listings yet
              </p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                This provider hasn&apos;t published anything yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}