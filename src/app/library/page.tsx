"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getApprovedLibraryEntries } from "@/services/libraryService";
import {
  LibraryEntry,
  LIBRARY_CATEGORIES,
  LibraryCategory,
} from "@/types/library";
import { LibraryCard } from "@/components/library/LibraryCard";
import { UniversityFilter } from "@/components/shared/UniversityFilter";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import {
  Search,
  BookOpen,
  Plus,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

type SortOption = "newest" | "popular" | "az";

export default function LibraryPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Read URL params on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setKeyword(q);
    const uni = params.get("uni");
    if (uni) setUniversityId(uni);
    const cat = params.get("cat");
    if (cat) setCategory(cat);
    const s = params.get("sort");
    if (s === "newest" || s === "popular" || s === "az") setSort(s);
  }, []);

  // ── Fetch ──
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getApprovedLibraryEntries();
        setEntries(data);
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
    if (category) params.set("cat", category);
    if (sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", next);
  }, [keyword, universityId, category, sort]);

  // ── Category counts (for tab badges + empty detection) ──
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((e) => {
      counts.set(e.category, (counts.get(e.category) || 0) + 1);
    });
    return counts;
  }, [entries]);

  const tabCategories = useMemo(
    () =>
      LIBRARY_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        count: categoryCounts.get(c.id) || 0,
      })),
    [categoryCounts]
  );

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

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    let list = entries.filter((e) => {
      if (universityId && e.universityId !== universityId) return false;
      if (category && e.category !== category) return false;
      if (q) {
        const hay = `${e.title} ${e.description} ${e.courseCode || ""} ${
          e.uploaderName || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const copy = [...list];
    if (sort === "newest") {
      copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sort === "popular") {
      copy.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === "az") {
      copy.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    }
    return copy;
  }, [entries, keyword, universityId, category, sort]);

  const hasAnyFilter = !!keyword || !!universityId || !!category || sort !== "newest";

  const selectedCategoryMeta = category
    ? LIBRARY_CATEGORIES.find((c) => c.id === category)
    : null;

  const handleClear = () => {
    setKeyword("");
    setUniversityId(null);
    setCategory(null);
    setSort("newest");
  };

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest first",
    popular: "Most viewed",
    az: "A → Z",
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      {/* ── Category tabs (sticky top) ── */}
      {!isFetching && (
        <CategoryTabs
          categories={tabCategories}
          selected={category}
          onChange={setCategory}
          counts={tabCounts}
          showAll
          allLabel="All materials"
          emptyCategoryIds={emptyCategoryIds}
        />
      )}

      <div className="container-wide py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">
            📚 Student Library
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Free study materials shared by students, for students
          </p>
        </div>

        {/* ── Search + University + Sort ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-0 overflow-hidden rounded-full border-2 border-[var(--nexora-primary)] bg-white shadow-sm focus-within:ring-4 focus-within:ring-[var(--nexora-primary)]/20">
            <div className="flex items-center gap-2 pl-4 pr-1 text-[var(--nexora-primary)]">
              <Search size={18} className="shrink-0" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by title, course code, or uploader..."
              className="flex-1 bg-transparent py-3 pr-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <UniversityFilter
                selected={universityId}
                onChange={setUniversityId}
              />
            </div>
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">
              {filtered.length}{" "}
              {filtered.length === 1 ? "material" : "materials"}
              {selectedCategoryMeta && ` · ${selectedCategoryMeta.label}`}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <SlidersHorizontal size={12} />
                {sortLabels[sort]}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                    {(["newest", "popular", "az"] as SortOption[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSort(s);
                          setShowSortMenu(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-xs transition-colors ${
                          sort === s
                            ? "bg-[var(--nexora-primary)]/5 font-semibold text-[var(--nexora-primary)]"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{sortLabels[s]}</span>
                        {sort === s && (
                          <span className="text-[var(--nexora-primary)]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Add material CTA (for logged-in users) ── */}
        {user && (
          <div className="mt-4">
            <Link
              href="/library/new"
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-left text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Plus size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Share your materials</p>
                <p className="text-xs text-white/80">
                  Upload past papers, notes, or guides to help other students
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="mt-6">
          {isFetching ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="mb-3 aspect-[16/10] w-full rounded-xl bg-gray-200" />
                  <div className="mb-2 h-3.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            /* Nothing on Peza at all */
            <EmptyState
              icon={<BookOpen size={28} />}
              title="The library is just getting started"
              message="Be the first to share your notes, past papers, or study guides with fellow students."
              subtitle="It only takes a minute — no file uploads, just a Google Drive link."
              actions={[
                { label: "Share material", href: "/library/new", variant: "primary" },
              ]}
            />
          ) : filtered.length === 0 ? (
            /* Filters returned nothing */
            <EmptyState
              emoji="🔍"
              title={keyword ? `No matches for "${keyword}"` : "No matches"}
              message="Try a different search, university, or category."
              actions={
                hasAnyFilter
                  ? [
                      {
                        label: "Clear all filters",
                        onClick: handleClear,
                        variant: "primary",
                      },
                    ]
                  : []
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((entry) => (
                <LibraryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}