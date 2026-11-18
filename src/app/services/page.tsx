// src/app/services/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getAllServices } from "@/services/serviceService";
import { Service, SERVICE_CATEGORIES } from "@/types/service";
import { ServiceCard } from "@/components/services/ServiceCard";
import { UniversityFilter } from "@/components/shared/UniversityFilter";
import { ListingSearchBar } from "@/components/shared/ListingSearchBar";
import { ListingFilters } from "@/components/shared/ListingFilters";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { ComingSoonState } from "@/components/shared/EmptyState";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import {
  applyServiceFilters,
  countActiveFilters,
  DEFAULT_SERVICE_FILTERS,
  ListingFilterState,
  SortOption,
} from "@/lib/filterListings";
import { Wrench, Sparkles } from "lucide-react"; // ⭐ Added Sparkles

const SORT_VALUES: SortOption[] = [
  "featured",
  "newest",
  "cheapest",
  "expensive",
  "popular",
  "shuffle",
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilterState>(
    DEFAULT_SERVICE_FILTERS
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    const q = params.get("q");
    if (q) setKeyword(q);

    const uni = params.get("uni");
    if (uni) setUniversityId(uni);

    const next: ListingFilterState = { ...DEFAULT_SERVICE_FILTERS };
    const cat = params.get("cat");
    if (cat) next.category = cat;
    const price = params.get("price");
    if (price) next.priceBucket = price;
    if (params.get("deals") === "1") next.dealsOnly = true;
    if (params.get("boosted") === "1") next.boostedOnly = true;
    if (params.get("online") === "1") next.onlineOnly = true;
    const sort = params.get("sort");
    if (sort && SORT_VALUES.includes(sort as SortOption)) {
      next.sort = sort as SortOption;
    }
    setFilters(next);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllServices();
        setServices(data.filter((s) => !s.adminHidden));
      } catch {
        // silent
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (universityId) params.set("uni", universityId);
    if (filters.category) params.set("cat", filters.category);
    if (filters.priceBucket) params.set("price", filters.priceBucket);
    if (filters.dealsOnly) params.set("deals", "1");
    if (filters.boostedOnly) params.set("boosted", "1");
    if (filters.onlineOnly) params.set("online", "1");
    if (filters.sort !== "featured") params.set("sort", filters.sort);

    const qs = params.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", next);
  }, [keyword, universityId, filters]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach((s) => {
      counts.set(s.category, (counts.get(s.category) || 0) + 1);
    });
    return counts;
  }, [services]);

  const tabCategories = useMemo(() => {
    return SERVICE_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      count: categoryCounts.get(c.id) || 0,
    }));
  }, [categoryCounts]);

  const emptyCategoryIds = useMemo(() => {
    if (isFetching) return new Set<string>();
    const set = new Set<string>();
    tabCategories.forEach((c) => {
      if (c.count === 0) set.add(c.id);
    });
    return set;
  }, [tabCategories, isFetching]);

  const tabCounts = useMemo(() => {
    const obj: Record<string, number> = {};
    tabCategories.forEach((c) => {
      obj[c.id] = c.count;
    });
    return obj;
  }, [tabCategories]);

  const filtered = useMemo(
    () => applyServiceFilters(services, keyword, universityId, filters),
    [services, keyword, universityId, filters]
  );

  const activeCount = countActiveFilters(filters);
  const hasAnyFilter = activeCount > 0 || !!keyword || !!universityId;

  const selectedCategoryEmpty =
    !!filters.category &&
    !isFetching &&
    (categoryCounts.get(filters.category) || 0) === 0;

  const selectedCategoryMeta = filters.category
    ? SERVICE_CATEGORIES.find((c) => c.id === filters.category)
    : null;

  const uniLabel = universityId ? getUniversityShortLabel(universityId) : undefined;

  const handleClear = () => {
    setKeyword("");
    setUniversityId(null);
    setFilters({ ...DEFAULT_SERVICE_FILTERS });
  };

  const triggerAskPeza = () => {
    window.dispatchEvent(
      new CustomEvent("openAskPeza", {
        detail: { defaultQuery: keyword ? `I'm looking for "${keyword}" service` : "" }
      })
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      {!isFetching && (
        <CategoryTabs
          categories={tabCategories}
          selected={filters.category}
          onChange={(id) => setFilters((f) => ({ ...f, category: id }))}
          counts={tabCounts}
          showAll
          allLabel="All services"
          emptyCategoryIds={emptyCategoryIds}
        />
      )}

      <div className="container-wide py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">
            🛠️ Services near you
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Trusted student services from verified providers
          </p>
        </div>

        <div className="space-y-3">
          <ListingSearchBar
            value={keyword}
            onChange={setKeyword}
            placeholder="Search services or providers..."
            storageKey="recentSearches_services"
          />

          <UniversityFilter selected={universityId} onChange={setUniversityId} />

          <ListingFilters
            mode="services"
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
          />
        </div>

        {!isFetching && filtered.length > 0 && (
          <p className="mt-4 hidden text-xs text-gray-500 md:block">
            {filtered.length} {filtered.length === 1 ? "service" : "services"}
            {selectedCategoryMeta && ` · ${selectedCategoryMeta.label}`}
            {filters.boostedOnly && " · Boosted only"}
            {filters.dealsOnly && " · With flash deals"}
            {filters.onlineOnly && " · Available online"}
          </p>
        )}

        <div className="mt-4">
          {isFetching ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="mb-3 aspect-[4/3] w-full rounded-xl bg-gray-200" />
                  <div className="mb-2 h-3.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : selectedCategoryEmpty && selectedCategoryMeta ? (
            <ComingSoonState
              label={selectedCategoryMeta.label}
              emoji={selectedCategoryMeta.icon}
              universityLabel={uniLabel}
            />
          ) : filtered.length === 0 ? (
            /* ⭐ CUSTOM EMPTY STATE WITH ASK PEZA */
            <div className="py-16 text-center rounded-2xl bg-white shadow-sm border border-gray-100">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                <Wrench size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {keyword ? `No matches for "${keyword}"` : "No services found"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                We couldn't find this service right now. But tell us what you need and our team will find a provider for you!
              </p>
              
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={triggerAskPeza}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  <Sparkles size={16} /> Ask Peza to find it
                </button>
                {hasAnyFilter && (
                  <button
                    onClick={handleClear}
                    className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}