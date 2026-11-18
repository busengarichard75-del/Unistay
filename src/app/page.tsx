// src/app/page.tsx
"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar/Navbar";
import { Hero } from "@/components/hero/Hero";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { SearchBar } from "@/components/Search/SearchBar";
import { PriceFilter } from "@/components/Search/PriceFilter";
import PropertyGrid from "@/components/property/PropertyGrid";
import { Footer } from "@/components/footer/Footer";
import { getAllProperties } from "@/services/propertyService";
import { Property } from "@/types/property";
import { useAuth } from "@/lib/AuthContext";
import { Sparkles, WifiOff, RefreshCw, Home as HomeIcon } from "lucide-react"; // ⭐ Renamed Home to HomeIcon
import { WhyPezaSection } from "@/components/home/WhyPezaSection";
import { ExplorePezaSection } from "@/components/home/ExplorePezaSection";
import { FeaturedStrip } from "@/components/home/FeaturedStrip";
import { ServicesMarketplaceStrip } from "@/components/home/ServicesMarketplaceStrip";
import { ListingFilters } from "@/components/shared/ListingFilters";
import {
  applyPropertyFilters,
  DEFAULT_PROPERTY_FILTERS,
  ListingFilterState,
} from "@/lib/filterListings";

const PreferenceModal = dynamic(
  () => import("@/components/find-my-best-house/PreferenceModal").then((mod) => mod.PreferenceModal),
  { ssr: false }
);

const NexoraChat = dynamic(
  () => import("@/components/nexora/NexoraChat").then((mod) => mod.NexoraChat),
  { ssr: false }
);

const LandlordOnboardingModal = dynamic(
  () => import("@/components/landlord/LandlordOnboardingModal").then((mod) => mod.LandlordOnboardingModal),
  { ssr: false }
);

function HomeContent() {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [filters, setFilters] = useState<ListingFilterState>(
    DEFAULT_PROPERTY_FILTERS
  );

  const [showFindModal, setShowFindModal] = useState(false);

  const effectiveRole = user?.role || null;
  const isStudent = user && effectiveRole === "student";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openModal") === "true") {
      setShowFindModal(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setShowFindModal(true);
    window.addEventListener("openFindModal", handleOpenModal);
    return () => {
      window.removeEventListener("openFindModal", handleOpenModal);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchProperties = async () => {
      setIsFetching(true);
      setError(false);
      try {
        const data = await getAllProperties();
        if (!active) return;
        setProperties(data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setIsFetching(false);
      }
    };

    fetchProperties();
    return () => {
      active = false;
    };
  }, [retryKey]);

  const filteredProperties = useMemo(() => {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;

    const prefiltered = properties.filter((property) => {
      if (property.isActive === false) return false;
      const price = property.price ?? 0;
      if (price < min || price > max) return false;
      return true;
    });

    return applyPropertyFilters(prefiltered, keyword, null, filters);
  }, [properties, keyword, minPrice, maxPrice, filters]);

  const handleRetry = () => {
    setRetryKey((k) => k + 1);
  };

  const triggerAskPeza = () => {
    window.dispatchEvent(
      new CustomEvent("openAskPeza", {
        detail: { 
          defaultQuery: keyword 
            ? `I'm looking for a room matching "${keyword}"` 
            : "I need a room near campus" 
        }
      })
    );
  };

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <Hero />

        <div className="container-wide py-12">
          <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <WifiOff size={28} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Slow or unstable connection
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
              We couldn&apos;t reach our servers. This usually means a weak
              signal — try again or move to a spot with better coverage.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isFetching}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-60"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              {isFetching ? "Retrying…" : "Try again"}
            </button>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <AnnouncementBanner />
      <Hero />
      <ExplorePezaSection onAccommodationSearch={setKeyword} />
      <FeaturedStrip />

      {isStudent && (
        <div className="container-wide mt-6">
          <div className="card-premium flex flex-col items-start justify-between gap-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-[var(--nexora-navy)]">
                🧭 Find My Best House
              </h3>
              <p className="text-sm text-gray-600">
                Tell us what matters to you. We&apos;ll find your best matches.
              </p>
            </div>
            <button
              onClick={() => setShowFindModal(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
            >
              <Sparkles size={18} />
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className="container-wide space-y-4 pt-6">
        <SearchBar value={keyword} onChange={setKeyword} />
        <PriceFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
        />
        <ListingFilters
          mode="properties"
          filters={filters}
          onChange={setFilters}
          resultCount={filteredProperties.length}
          hidePrice
        />
      </div>

      {isFetching ? (
        <div className="container-wide pb-8 pt-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 h-40 w-full rounded-xl bg-gray-200" />
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mb-3 h-4 w-1/3 rounded bg-gray-200" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-3 w-12 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredProperties.length === 0 ? (
        /* ⭐ CUSTOM EMPTY STATE WITH ASK PEZA */
        <div className="container-wide py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
            <HomeIcon size={28} /> {/* ⭐ Using the renamed icon */}
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {keyword ? `No rooms found for "${keyword}"` : "No matches found"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            We don't have this specific room right now, but our concierge team can source it for you. Just tell us your budget and preferred area!
          </p>
          
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={triggerAskPeza}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <Sparkles size={16} /> Ask Peza to find it
            </button>
            <button
              onClick={() => {
                setKeyword("");
                setMinPrice("");
                setMaxPrice("");
                setFilters({ ...DEFAULT_PROPERTY_FILTERS });
              }}
              className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="container-wide pb-8 pt-4">
          <PropertyGrid
            properties={filteredProperties}
            afterFirstGroup={<ServicesMarketplaceStrip />}
          />
        </div>
      )}

      <WhyPezaSection />
      <Footer />

      <NexoraChat />

      {showFindModal && (
        <PreferenceModal
          isOpen={showFindModal}
          onClose={() => setShowFindModal(false)}
        />
      )}

      {user && user.role === "landlord" && (
        <LandlordOnboardingModal
          landlordName={user.fullName || user.email?.split("@")[0] || "Landlord"}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}