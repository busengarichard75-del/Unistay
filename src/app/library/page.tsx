// src/app/library/page.tsx
"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getApprovedLibraryEntries } from "@/services/libraryService";
import { LibraryEntry, LIBRARY_CATEGORIES } from "@/types/library";
import { LibraryCard } from "@/components/library/LibraryCard";
import { UniversityFilter } from "@/components/shared/UniversityFilter";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { getDailySeed, seededShuffleById } from "@/lib/seededShuffle";
import { StudyVibesModal } from "@/components/library/StudyVibesModal";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { getCoverArt } from "@/lib/coverArt";
import {
  getSavedSnapshot,
  getEmptySnapshot,
  subscribe,
} from "@/lib/savedLibrary";
import {
  Search,
  BookOpen,
  Plus,
  X,
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Shuffle,
  Sparkles,
  Phone,
  Bookmark,
  ArrowRight,
} from "lucide-react";

type SortOption = "random" | "newest" | "popular" | "az";

function pickSpotlight(entries: LibraryEntry[]): LibraryEntry | null {
  if (!entries.length) return null;
  const seed = `spotlight-${getDailySeed()}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return entries[Math.abs(h) % entries.length];
}

export default function LibraryPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("random");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // ONE shared subscription — reads localStorage exactly once (cached).
  const savedSet = useSyncExternalStore(
    subscribe,
    getSavedSnapshot,
    getEmptySnapshot
  );

  // ── URL params on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q");
    if (q) setKeyword(q);
    const uni = p.get("uni");
    if (uni) setUniversityId(uni);
    const cat = p.get("cat");
    if (cat) setCategory(cat);
    const s = p.get("sort");
    if (s === "newest" || s === "popular" || s === "az" || s === "random") setSort(s);
    if (p.get("saved") === "1") setShowSavedOnly(true);
  }, []);

  // ── Fetch ──
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getApprovedLibraryEntries();
        setEntries(data);
      } catch {
        // silent (fix later — see earlier note)
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, []);

  // ── URL sync ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams();
    if (keyword.trim()) p.set("q", keyword.trim());
    if (universityId) p.set("uni", universityId);
    if (category) p.set("cat", category);
    if (sort !== "random") p.set("sort", sort);
    if (showSavedOnly) p.set("saved", "1");
    const qs = p.toString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
  }, [keyword, universityId, category, sort, showSavedOnly]);

  // ── Category counts ──
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e.category, (m.get(e.category) || 0) + 1));
    return m;
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
    const s = new Set<string>();
    tabCategories.forEach((c) => {
      if (c.count === 0) s.add(c.id);
    });
    return s;
  }, [tabCategories, isFetching]);

  const tabCounts = useMemo(() => {
    const o: Record<string, number> = {};
    tabCategories.forEach((c) => {
      o[c.id] = c.count;
    });
    return o;
  }, [tabCategories]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    const list = entries.filter((e) => {
      if (showSavedOnly && !savedSet.has(e.id)) return false;
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
    if (sort === "random") {
      return seededShuffleById(copy, `library-${getDailySeed()}`);
    }
    if (sort === "newest") {
      copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sort === "popular") {
      copy.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === "az") {
      copy.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return copy;
  }, [entries, keyword, universityId, category, sort, showSavedOnly, savedSet]);

  const hasAnyFilter =
    !!keyword || !!universityId || !!category || sort !== "random" || showSavedOnly;

  // ── Trending ──
  const trendingEntries = useMemo(
    () =>
      [...entries]
        .filter((e) => (e.views || 0) > 0)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3),
    [entries]
  );
  const showTrending =
    trendingEntries.length >= 2 && !hasAnyFilter && !isFetching;

  // ── Material of the Day ──
  const spotlight = useMemo(
    () => (!hasAnyFilter && !isFetching ? pickSpotlight(entries) : null),
    [entries, hasAnyFilter, isFetching]
  );
  const spotlightArt = useMemo(
    () => (spotlight ? getCoverArt(spotlight.id, spotlight.category) : null),
    [spotlight]
  );
  const gridEntries = spotlight
    ? filtered.filter((e) => e.id !== spotlight.id)
    : filtered;

  const selectedCategoryMeta = category
    ? LIBRARY_CATEGORIES.find((c) => c.id === category)
    : null;

  const handleClear = () => {
    setKeyword("");
    setUniversityId(null);
    setCategory(null);
    setSort("random");
    setShowSavedOnly(false);
  };

  const sortLabels: Record<SortOption, string> = {
    random: "Discover (Shuffle)",
    newest: "Newest first",
    popular: "Most viewed",
    az: "A → Z",
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

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

      <div className="container-wide py-4">
        {/* ⭐ SEARCH + UNIVERSITY + SORT — moved to the very top */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-0 overflow-hidden rounded-full border-2 border-[var(--nexora-primary)] bg-white shadow-sm focus-within:ring-4 focus-within:ring-[var(--nexora-primary)]/20">
            <div className="flex items-center gap-2 pl-3 pr-1 text-[var(--nexora-primary)]">
              <Search size={16} className="shrink-0" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by title, course code, or uploader..."
              className="flex-1 bg-transparent py-2.5 pr-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={14} />
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

          {/* Count + Saved toggle + Sort */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">
              {filtered.length}{" "}
              {filtered.length === 1 ? "material" : "materials"}
              {selectedCategoryMeta && ` · ${selectedCategoryMeta.label}`}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSavedOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  showSavedOnly
                    ? "bg-[var(--nexora-primary)] text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bookmark size={11} className={showSavedOnly ? "fill-white" : ""} />
                Saved{savedSet.size > 0 ? ` (${savedSet.size})` : ""}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {sort === "random" ? (
                    <Shuffle size={11} />
                  ) : (
                    <SlidersHorizontal size={11} />
                  )}
                  {sortLabels[sort]}
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${
                      showSortMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute right-0 top-full z-30 mt-1.5 min-w-[170px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                      {(["random", "newest", "popular", "az"] as SortOption[]).map(
                        (s) => (
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
                            <span className="flex items-center gap-2">
                              {s === "random" && <Shuffle size={12} />}
                              {sortLabels[s]}
                            </span>
                            {sort === s && (
                              <span className="text-[var(--nexora-primary)]">✓</span>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header + manager phone */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-[var(--nexora-navy)]">
            📚 Student Library
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Free study materials shared by students, for students
          </p>
          <a
            href="tel:+260767924893"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Phone size={11} />
            Library Manager · 0767 924 893
          </a>
        </div>

        {/* Study Vibes */}
        <div className="mb-4">
          <button
            onClick={() => setShowVibes(true)}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-0.5 shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-black/10 p-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-2 ring-white/10 transition-all group-hover:ring-white/30">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div className="min-w-0 text-left text-white">
                <p className="flex items-center gap-1.5 text-sm font-extrabold">
                  Study Vibes
                  <span className="rounded bg-white/20 px-1.5 py-0 text-[9px] uppercase tracking-wider">
                    New
                  </span>
                </p>
                <p className="text-[11px] text-white/90">
                  Tell us your mood, and we'll pick the perfect materials for you.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Material of the Day spotlight */}
        {spotlight && spotlightArt && (
          <Link
            href={`/library/${spotlight.id}`}
            className="group relative mb-4 block overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-lg"
            style={{ background: spotlightArt.background }}
          >
            <div className="relative p-4">
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative text-white">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-95">
                  <Sparkles size={11} /> Today's pick
                </div>
                <h2 className="mt-1 line-clamp-2 text-base font-extrabold leading-tight sm:text-lg">
                  {spotlight.title}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-[11px] opacity-90">
                  {getUniversityShortLabel(spotlight.universityId)}
                  {spotlight.courseCode && (
                    <>
                      <span>·</span>
                      {spotlight.courseCode}
                    </>
                  )}
                  <span className="ml-auto inline-flex items-center gap-0.5 font-semibold">
                    Open <ArrowRight size={11} />
                  </span>
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Trending — compact horizontal scroll */}
        {showTrending && (
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-1.5 px-0.5">
              <Flame className="text-orange-500" size={16} />
              <h2 className="text-sm font-bold text-gray-900">Trending Now</h2>
              <span className="rounded-full bg-orange-100 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider text-orange-600">
                Top 3
              </span>
            </div>
            <div className="flex snap-x gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trendingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="min-w-[200px] max-w-[200px] flex-shrink-0 snap-start"
                >
                  <LibraryCard
                    entry={entry}
                    variant="horizontal"
                    isSaved={savedSet.has(entry.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add material CTA */}
        {user && (
          <div className="mt-3">
            <Link
              href="/library/new"
              className="flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-3 text-left text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Plus size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">Share your materials</p>
                <p className="text-[10px] text-white/80">
                  Upload past papers, notes, or guides to help other students
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Grid */}
        <div className="mt-4">
          {isFetching ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer rounded-xl bg-white p-2 shadow-sm"
                >
                  <div className="mb-2 aspect-[4/3] w-full rounded-lg bg-gray-200" />
                  <div className="mb-1 h-2.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-2 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : showSavedOnly && gridEntries.length === 0 ? (
            <EmptyState
              emoji="🔖"
              title="No saved materials yet"
              message="Tap the bookmark icon on any card to save it for later."
              actions={[
                {
                  label: "Browse all materials",
                  onClick: () => setShowSavedOnly(false),
                  variant: "primary",
                },
              ]}
            />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} />}
              title="The library is just getting started"
              message="Be the first to share your notes, past papers, or study guides with fellow students."
              subtitle="It only takes a minute — no file uploads, just a Google Drive link."
              actions={[
                {
                  label: "Share material",
                  href: "/library/new",
                  variant: "primary",
                },
              ]}
            />
          ) : gridEntries.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title={keyword ? `No matches for "${keyword}"` : "No matches"}
              message="We couldn't find this in the library right now. But our concierge team can source it for you!"
              actions={[
                {
                  label: "Ask Peza to find it",
                  onClick: () =>
                    window.dispatchEvent(
                      new CustomEvent("openAskPeza", {
                        detail: {
                          defaultQuery: keyword
                            ? `I need study materials for "${keyword}"`
                            : "",
                        },
                      })
                    ),
                  variant: "primary",
                },
                ...(hasAnyFilter
                  ? [
                      {
                        label: "Clear all filters",
                        onClick: handleClear,
                        variant: "secondary" as const,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {gridEntries.map((entry) => (
                <LibraryCard
                  key={entry.id}
                  entry={entry}
                  isSaved={savedSet.has(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      <StudyVibesModal
        isOpen={showVibes}
        onClose={() => setShowVibes(false)}
        entries={entries}
      />
    </main>
  );
}