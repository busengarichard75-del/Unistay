"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getPublicUserProfile, PublicUserProfile } from "@/services/userService";
import { getServicesByOwner } from "@/services/serviceService";
import { getProductsByOwner } from "@/services/productService";
import { getFollowerCount } from "@/services/followService";
import { Service, isServiceBoosted } from "@/types/service";
import { Product, isProductBoosted } from "@/types/product";
import { getUniversityFullName } from "@/lib/universityLabels";
import { getShopTheme } from "@/lib/shopThemes";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ProductCard } from "@/components/products/ProductCard";
import { FollowButton } from "@/components/follow/FollowButton";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  Wrench,
  ShoppingBag,
  MapPin,
  Calendar,
  Store,
  AlertTriangle,
  Share2,
  Star,
  Users,
} from "lucide-react";

export default function ProviderProfilePage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const uid = params?.uid;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  // ── Avatar fallback if the image URL fails to load ──
  const [imgError, setImgError] = useState(false);

  // ── Share feedback state ──
  const [shared, setShared] = useState(false);

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

        const [s, pr, followers] = await Promise.all([
          getServicesByOwner(uid),
          getProductsByOwner(uid),
          getFollowerCount(uid),
        ]);
        if (!active) return;

        setServices(s.filter((x) => !x.adminHidden));
        setProducts(pr.filter((x) => !x.adminHidden));
        setFollowerCount(followers);

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

  async function handleShareShop() {
    if (!profile) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${profile.displayName} on Peza`;
    const text = `Check out ${profile.displayName} on Peza — services, products, and more. Tap to browse:`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      toast.success("Shop link copied — share it anywhere!");
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User cancelled — silent
    }
  }

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

  // ─── Shop customization ───
  const shopSettings = profile.shopSettings || {};
  const theme = getShopTheme(shopSettings.accentColor);
  const tagline = shopSettings.tagline?.trim();
  const bannerUrl = shopSettings.bannerUrl;
  const featuredId = shopSettings.featuredListingId;
  const featuredType = shopSettings.featuredListingType;

  // ─── Sort: featured first (if set), then boosted, then newest ───
  const sortWithFeatured = <T extends { id: string; boostedAt?: number | null; createdAt?: number }>(
    list: T[],
    isBoosted: (item: T) => boolean
  ): { featured: T | null; rest: T[] } => {
    const featured = featuredId
      ? list.find((x) => x.id === featuredId) || null
      : null;

    const rest = list.filter((x) => x.id !== featuredId);

    rest.sort((a, b) => {
      const aB = isBoosted(a) ? 1 : 0;
      const bB = isBoosted(b) ? 1 : 0;
      if (aB !== bB) return bB - aB;
      if (aB) return (b.boostedAt || 0) - (a.boostedAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return { featured, rest };
  };

  const { featured: featuredService, rest: restServices } = sortWithFeatured(
    services,
    isServiceBoosted
  );
  const { featured: featuredProduct, rest: restProducts } = sortWithFeatured(
    products,
    isProductBoosted
  );

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

  const totalServices = services.length;
  const totalProducts = products.length;
  const hasServices = totalServices > 0;
  const hasProducts = totalProducts > 0;
  const showAvatar = !!profile.photoURL && !imgError;

  // ─── Additive: follower count ───
  const showFollowerCount = followerCount > 0;

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
          {/* Header background — gradient + optional banner */}
          <div
            className={`relative overflow-hidden bg-gradient-to-r ${theme.gradient} px-6 py-8 text-white`}
          >
            {bannerUrl && (
              <>
                <img
                  src={bannerUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            )}

            <div className="relative flex flex-wrap items-center gap-5">
              {/* ── Avatar ── */}
              {showAvatar ? (
                <img
                  src={profile.photoURL!}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-lg ring-2 ring-white/20"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white shadow-lg backdrop-blur">
                  {initials || "PZ"}
                </div>
              )}

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

                {/* 🎨 Tagline (custom, optional) */}
                {tagline && (
                  <p className="mt-1.5 max-w-xl text-sm font-medium text-white/95">
                    {tagline}
                  </p>
                )}

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

                {/* ─── Additive: follower count (hidden when 0) ─── */}
                {showFollowerCount && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85">
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {followerCount} follower{followerCount === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Actions: Follow + Share ── */}
              <div className="flex shrink-0 items-center gap-2">
                <FollowButton
                  variant="full"
                  providerId={profile.uid}
                  providerName={profile.displayName}
                  providerPhotoURL={profile.photoURL}
                />
                <button
                  type="button"
                  onClick={handleShareShop}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25 active:scale-95"
                  aria-label="Share this shop"
                >
                  <Share2 size={14} />
                  {shared ? "Copied!" : "Share"}
                </button>
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
                {totalServices}
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
                {totalProducts}
              </span>
            </button>
          </div>
        </div>

        {/* ─── Listings ─── */}
        <div className="mt-6">
          {activeTab === "services" && hasServices && (
            <>
              {featuredService && featuredType === "service" && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <Star size={10} fill="currentColor" />
                      Featured
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl ring-2 ring-amber-300 ring-offset-2">
                      <ServiceCard service={featuredService} />
                    </div>
                  </div>
                </div>
              )}

              <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
                Services
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({totalServices})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(featuredService && featuredType === "service"
                  ? restServices
                  : services
                ).map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </>
          )}

          {activeTab === "products" && hasProducts && (
            <>
              {featuredProduct && featuredType === "product" && (
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <Star size={10} fill="currentColor" />
                      Featured
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl ring-2 ring-amber-300 ring-offset-2">
                      <ProductCard product={featuredProduct} />
                    </div>
                  </div>
                </div>
              )}

              <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
                Products
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({totalProducts})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(featuredProduct && featuredType === "product"
                  ? restProducts
                  : products
                ).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}

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