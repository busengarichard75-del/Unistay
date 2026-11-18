// src/app/marketplace/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getAllProducts } from "@/services/productService";
import {
  Product,
  PRODUCT_CATEGORIES,
  getProductCategoryLabel,
  getProductCategoryIcon,
} from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";
import { UniversityFilter } from "@/components/shared/UniversityFilter";
import { ListingSearchBar } from "@/components/shared/ListingSearchBar";
import { ListingFilters } from "@/components/shared/ListingFilters";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { ComingSoonState } from "@/components/shared/EmptyState";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import {
  applyProductFilters,
  countActiveFilters,
  DEFAULT_PRODUCT_FILTERS,
  ListingFilterState,
  SortOption,
} from "@/lib/filterListings";
import { ShoppingBag, Sparkles } from "lucide-react"; // ⭐ Added Sparkles

const SORT_VALUES: SortOption[] = [
  "featured",
  "newest",
  "cheapest",
  "expensive",
  "popular",
  "shuffle",
];

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilterState>(
    DEFAULT_PRODUCT_FILTERS
  );

  // ── Read URL params on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    const q = params.get("q");
    if (q) setKeyword(q);

    const uni = params.get("uni");
    if (uni) setUniversityId(uni);

    const next: ListingFilterState = { ...DEFAULT_PRODUCT_FILTERS };
    const cat = params.get("cat");
    if (cat) next.category = cat;
    const price = params.get("price");
    if (price) next.priceBucket = price;
    const cond = params.get("cond");
    if (cond) next.condition = cond;
    if (params.get("deals") === "1") next.dealsOnly = true;
    if (params.get("boosted") === "1") next.boostedOnly = true;
    if (params.get("sold") === "1") next.hideSold = false;
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
        const data = await getAllProducts();
        setProducts(data.filter((p) => !p.adminHidden));
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
    if (filters.condition) params.set("cond", filters.condition);
    if (filters.dealsOnly) params.set("deals", "1");
    if (filters.boostedOnly) params.set("boosted", "1");
    if (!filters.hideSold) params.set("sold", "1");
    if (filters.sort !== "featured") params.set("sort", filters.sort);

    const qs = params.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", next);
  }, [keyword, universityId, filters]);

  // ── Counts per category (all products, ignores current filter) ──
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const c = p.category || "other";
      counts.set(c, (counts.get(c) || 0) + 1);
    });
    return counts;
  }, [products]);

  // ── Tabs: canonical first (all of them), then any legacy categories ──
  const tabCategories = useMemo(() => {
    const tabs: { id: string; label: string; icon: string; count: number }[] = [];
    const seen = new Set<string>();

    PRODUCT_CATEGORIES.forEach((c) => {
      tabs.push({
        id: c.id,
        label: c.label,
        icon: c.icon,
        count: categoryCounts.get(c.id) || 0,
      });
      seen.add(c.id);
    });

    categoryCounts.forEach((n, id) => {
      if (seen.has(id)) return;
      tabs.push({
        id,
        label: getProductCategoryLabel(id),
        icon: getProductCategoryIcon(id),
        count: n,
      });
    });

    return tabs;
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

  // ── Apply filters + sort ──
  const filtered = useMemo(
    () => applyProductFilters(products, keyword, universityId, filters),
    [products, keyword, universityId, filters]
  );

  const activeCount = countActiveFilters(filters);
  const hasAnyFilter = activeCount > 0 || !!keyword || !!universityId;

  const selectedCategoryEmpty =
    !!filters.category &&
    !isFetching &&
    (categoryCounts.get(filters.category) || 0) === 0;

  const selectedCategoryMeta = filters.category
    ? {
        label: getProductCategoryLabel(filters.category),
        icon: getProductCategoryIcon(filters.category),
      }
    : null;

  const uniLabel = universityId ? getUniversityShortLabel(universityId) : undefined;

  const handleClear = () => {
    setKeyword("");
    setUniversityId(null);
    setFilters({ ...DEFAULT_PRODUCT_FILTERS });
  };

  const triggerAskPeza = () => {
    window.dispatchEvent(
      new CustomEvent("openAskPeza", {
        detail: { defaultQuery: keyword ? `I'm looking for "${keyword}"` : "" }
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
          allLabel="All products"
          emptyCategoryIds={emptyCategoryIds}
        />
      )}

      <div className="container-wide py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">
            🛒 Marketplace
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Buy and sell with students near you
          </p>
        </div>

        <div className="space-y-3">
          <ListingSearchBar
            value={keyword}
            onChange={setKeyword}
            placeholder="Search products..."
            storageKey="recentSearches_products"
          />

          <UniversityFilter selected={universityId} onChange={setUniversityId} />

          <ListingFilters
            mode="products"
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
          />
        </div>

        {!isFetching && filtered.length > 0 && (
          <p className="mt-4 hidden text-xs text-gray-500 md:block">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
            {selectedCategoryMeta && ` · ${selectedCategoryMeta.label}`}
            {filters.boostedOnly && " · Boosted only"}
            {filters.dealsOnly && " · With flash deals"}
            {!filters.hideSold && " · Including sold"}
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {keyword ? `No matches for "${keyword}"` : "No products found"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                We couldn't find exactly what you were looking for right now. But our concierge team can source it for you!
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
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}