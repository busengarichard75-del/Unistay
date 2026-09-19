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
import { ComingSoonState, NoMatchState } from "@/components/shared/EmptyState";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import {
  applyServiceFilters,
  countActiveFilters,
  DEFAULT_SERVICE_FILTERS,
  ListingFilterState,
  SortOption,
} from "@/lib/filterListings";
import { Wrench } from "lucide-react";

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

  // ── Read URL params on mount ──
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

  // ── Fetch ──
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

  // ── URL sync ──
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

  // ── Counts per category (used for tab counts + empty detection) ──
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach((s) => {
      counts.set(s.category, (counts.get(s.category) || 0) + 1);
    });
    return counts;
  }, [services]);

  // ── Tabs: ALL canonical categories (ordered by SERVICE_CATEGORIES) ──
  const tabCategories = useMemo(() => {
    return SERVICE_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      count: categoryCounts.get(c.id) || 0,
    }));
  }, [categoryCounts]);

  // ── Empty categories (only if we've finished loading; before that we show all as non-empty) ──
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

  // ── Apply filters + sort ──
  const filtered = useMemo(
    () => applyServiceFilters(services, keyword, universityId, filters),
    [services, keyword, universityId, filters]
  );

  const activeCount = countActiveFilters(filters);
  const hasAnyFilter =
    activeCount > 0 || !!keyword || !!universityId;

  // ── Is the selected category empty (no listings at all)? ──
  const selectedCategoryEmpty =
    !!filters.category &&
    !isFetching &&
    (categoryCounts.get(filters.category) || 0) === 0;

  // ── Copy for the "no results" case ──
  const selectedCategoryMeta = filters.category
    ? SERVICE_CATEGORIES.find((c) => c.id === filters.category)
    : null;

  const uniLabel = universityId ? getUniversityShortLabel(universityId) : undefined;

  const handleClear = () => {
    setKeyword("");
    setUniversityId(null);
    setFilters({ ...DEFAULT_SERVICE_FILTERS });
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      {/* ── Category tabs (sticky top) ── */}
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
            /* ── Empty category → "coming soon" recruitment state ── */
            <ComingSoonState
              label={selectedCategoryMeta.label}
              emoji={selectedCategoryMeta.icon}
              universityLabel={uniLabel}
            />
          ) : filtered.length === 0 ? (
            /* ── Filters returned nothing, but category has listings ── */
            hasAnyFilter ? (
              <NoMatchState
                keyword={keyword.trim() || undefined}
                hasFilters
                onClear={handleClear}
              />
            ) : (
              <div className="card-premium p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                  <Wrench size={28} />
                </div>
                <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                  No services yet
                </p>
                <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                  Service providers haven&apos;t added anything yet — check back soon.
                </p>
                <a
                  href="/signup/provider"
                  className="mt-4 inline-flex items-center rounded-full bg-[var(--nexora-primary)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
                >
                  Become a provider
                </a>
              </div>
            )
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