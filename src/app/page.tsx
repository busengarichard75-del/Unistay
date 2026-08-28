"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Hero } from "@/components/hero/Hero";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { SearchBar } from "@/components/Search/SearchBar";
import { PriceFilter } from "@/components/Search/PriceFilter";
import PropertyGrid from "@/components/property/PropertyGrid"; // ✅ Fixed import
import { Footer } from "@/components/footer/Footer";
import { getAllProperties } from "@/services/propertyService";
import { Property } from "@/types/property";
import { isBoosted } from "@/lib/boostService";
import { useAuth } from "@/lib/AuthContext";
import { Sparkles } from "lucide-react";
import { PreferenceModal } from "@/components/find-my-best-house/PreferenceModal";
import { NexoraChat } from "@/components/nexora/NexoraChat";
import { PageTransition } from "@/components/PageTransition";

function HomeContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);

  const effectiveRole = user?.role || null;
  const isStudent = user && effectiveRole === "student";

  useEffect(() => {
    if (searchParams.get("openModal") === "true") {
      setShowFindModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenModal = () => setShowFindModal(true);
    window.addEventListener("openFindModal", handleOpenModal);
    return () => window.removeEventListener("openFindModal", handleOpenModal);
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getAllProperties();
        setProperties(data);
      } catch {
        setError(true);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProperties();
  }, []);

  const filteredProperties = properties
    .filter((property) => {
      if (property.isActive === false) return false;
      const search = keyword.toLowerCase();
      const matchesKeyword =
        property.title.toLowerCase().includes(search) ||
        property.location.toLowerCase().includes(search);
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      const matchesPrice = property.price >= min && property.price <= max;
      const availableCount = (property.bedSpaces ?? []).filter((bed) => bed.isAvailable).length;
      const matchesAvailability = !showAvailableOnly || availableCount > 0;
      return matchesKeyword && matchesPrice && matchesAvailability;
    })
    .sort((a, b) => {
      const aBoosted = isBoosted(a);
      const bBoosted = isBoosted(b);
      if (aBoosted && !bBoosted) return -1;
      if (!aBoosted && bBoosted) return 1;
      if (aBoosted && bBoosted) {
        return (b.boostedAt || 0) - (a.boostedAt || 0);
      }
      return a.title.localeCompare(b.title);
    });

  if (error) {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <Hero />
        <p className="p-8 text-center text-sm text-red-600">
          Failed to load properties. Please check your internet connection and try again.
        </p>
        <Footer />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <AnnouncementBanner />
        <Hero />

        {isStudent && (
          <div className="container-wide mt-6">
            <div className="card-premium bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--nexora-navy)]">🧭 Find My Best House</h3>
                <p className="text-sm text-gray-600">Tell us what matters to you. We'll find your best matches.</p>
              </div>
              <button
                onClick={() => setShowFindModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)] transition-colors shrink-0"
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
          <label className="flex w-fit items-center gap-2 text-sm text-[var(--nexora-text-secondary)]">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[var(--nexora-primary)] focus:ring-[var(--nexora-primary)]"
            />
            Available beds only
          </label>
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
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    <div className="h-3 w-14 rounded bg-gray-200" />
                    <div className="h-3 w-14 rounded bg-gray-200" />
                    <div className="h-3 w-14 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <p className="container-wide p-8 text-center text-sm text-[var(--nexora-text-secondary)]">
            No properties match your filters. Try adjusting your search or price range.
          </p>
        ) : (
          <div className="container-wide pb-8 pt-4">
            <PropertyGrid properties={filteredProperties} />
          </div>
        )}

        <Footer />
        <NexoraChat />
        <PreferenceModal isOpen={showFindModal} onClose={() => setShowFindModal(false)} />
      </main>
    </PageTransition>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--nexora-surface)] flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <HomeContent />
    </Suspense>
  );
}