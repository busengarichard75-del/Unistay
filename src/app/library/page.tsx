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
import { getSavedSnapshot, getEmptySnapshot, subscribe } from "@/lib/savedLibrary";
import {
  Search, BookOpen, Plus, X, SlidersHorizontal, ChevronDown,
  Flame, Shuffle, Sparkles, Phone, Bookmark, ArrowRight,
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

  const savedSet = useSyncExternalStore(subscribe, getSavedSnapshot, getEmptySnapshot);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("q")) setKeyword(p.get("q")!);
    if (p.get("uni")) setUniversityId(p.get("uni"));
    if (p.get("cat")) setCategory(p.get("cat"));
    if (p.get("sort")) setSort(p.get("sort") as SortOption);
    if (p.get("saved") === "1") setShowSavedOnly(true);
  }, []);

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

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e.category, (m.get(e.category) || 0) + 1));
    return m;
  }, [entries]);

  const tabCategories = useMemo(
    () => LIBRARY_CATEGORIES.map((c) => ({
      id: c.id, label: c.label, icon: c.icon, count: categoryCounts.get(c.id) || 0,
    })),
    [categoryCounts]
  );

  const tabCounts = useMemo(() => {
    const o: Record<string, number> = {};
    tabCategories.forEach((c) => { o[c.id] = c.count; });
    return o;
  }, [tabCategories]);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    const list = entries.filter((e) => {
      if (showSavedOnly && !savedSet.has(e.id)) return false;
      if (universityId && e.universityId !== universityId) return false;
      if (category && e.category !== category) return false;
      if (q) {
        const hay = `${e.title} ${e.description} ${e.courseCode || ""} ${e.uploaderName || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const copy = [...list];
    if (sort === "random") return seededShuffleById(copy, `library-${getDailySeed()}`);
    if (sort === "newest") copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    else if (sort === "popular") copy.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sort === "az") copy.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return copy;
  }, [entries, keyword, universityId, category, sort, showSavedOnly, savedSet]);

  const hasAnyFilter = !!keyword || !!universityId || !!category || sort !== "random" || showSavedOnly;

  const trendingEntries = useMemo(() => 
    [...entries].filter((e) => (e.views || 0) > 0).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3), 
  [entries]);
  
  const showTrending = trendingEntries.length >= 2 && !hasAnyFilter && !isFetching;

  const spotlight = useMemo(
    () => (!hasAnyFilter && !isFetching ? pickSpotlight(entries) : null),
    [entries, hasAnyFilter, isFetching]
  );
  const spotlightArt = useMemo(
    () => (spotlight ? getCoverArt(spotlight.id, spotlight.category) : null),
    [spotlight]
  );
  const gridEntries = spotlight ? filtered.filter((e) => e.id !== spotlight.id) : filtered;

  const handleClear = () => {
    setKeyword(""); setUniversityId(null); setCategory(null); setSort("random"); setShowSavedOnly(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)] w-[100vw] max-w-[100vw] overflow-x-hidden">
      <Navbar />

      {/* Force CategoryTabs to scroll internally, NOT stretch the page */}
      {!isFetching && (
        <div className="w-full max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryTabs
            categories={tabCategories}
            selected={category}
            onChange={setCategory}
            counts={tabCounts}
            showAll
            allLabel="All materials"
            emptyCategoryIds={new Set()}
          />
        </div>
      )}

      {/* 🔒 Strict full-width container with px-2 to prevent overflow */}
      <div className="w-full max-w-full px-2 py-3 flex flex-col gap-4">
        
        {/* SEARCH & FILTERS */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex w-full items-center rounded-full border-2 border-[var(--nexora-primary)] bg-white shadow-sm overflow-hidden">
            <div className="pl-3 text-[var(--nexora-primary)]">
              <Search size={16} className="shrink-0" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search materials..."
              className="flex-1 w-full min-w-0 bg-transparent py-2 px-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            {keyword && (
              <button onClick={() => setKeyword("")} className="pr-3 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <UniversityFilter selected={universityId} onChange={setUniversityId} />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setShowSavedOnly((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  showSavedOnly ? "bg-[var(--nexora-primary)] text-white" : "border border-gray-200 bg-white text-gray-700"
                }`}
              >
                <Bookmark size={11} className={showSavedOnly ? "fill-white" : ""} />
                Saved
              </button>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="relative inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700"
              >
                {sort === "random" ? <Shuffle size={11} /> : <SlidersHorizontal size={11} />}
                <ChevronDown size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* HEADER & PHONE */}
        <div className="w-full">
          <h1 className="text-lg font-bold text-[var(--nexora-navy)]">📚 Student Library</h1>
          <p className="text-[11px] text-gray-500">Free study materials, shared by students.</p>
          <a href="tel:+260767924893" className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
            <Phone size={10} /> Library Manager · 0767 924 893
          </a>
        </div>

        {/* STUDY VIBES */}
        <button onClick={() => setShowVibes(true)} className="group w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-0.5 shadow-sm active:scale-[0.99]">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-black/10 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <Sparkles size={14} />
            </div>
            <div className="text-left text-white min-w-0">
              <p className="text-xs font-extrabold flex items-center gap-1">Study Vibes <span className="rounded bg-white/20 px-1 py-0 text-[8px] uppercase">New</span></p>
              <p className="text-[10px] text-white/90 truncate">Tell us your mood, we'll pick for you.</p>
            </div>
          </div>
        </button>

        {/* SPOTLIGHT */}
        {spotlight && spotlightArt && (
          <Link href={`/library/${spotlight.id}`} className="relative block w-full overflow-hidden rounded-xl shadow-sm" style={{ background: spotlightArt.background }}>
            <div className="relative p-3">
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative text-white">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"><Sparkles size={10} /> Today's pick</div>
                <h2 className="mt-0.5 line-clamp-1 text-sm font-extrabold">{spotlight.title}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-[10px]">
                  {getUniversityShortLabel(spotlight.universityId)}
                  {spotlight.courseCode && <><span>·</span>{spotlight.courseCode}</>}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* TRENDING */}
        {showTrending && (
          <div className="w-full max-w-full">
            <div className="mb-1.5 flex items-center gap-1">
              <Flame className="text-orange-500" size={14} />
              <h2 className="text-xs font-bold text-gray-900">Trending Now</h2>
            </div>
            <div className="flex w-full snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trendingEntries.map((entry) => (
                <div key={entry.id} className="w-[160px] shrink-0 snap-start">
                  <LibraryCard entry={entry} variant="horizontal" isSaved={savedSet.has(entry.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHARE CTA */}
        {user && (
          <Link href="/library/new" className="w-full flex items-center gap-2 rounded-xl bg-indigo-600 p-2.5 text-white shadow-sm active:scale-[0.99]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><Plus size={14} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">Share your materials</p>
              <p className="text-[10px] text-white/80 truncate">Upload past papers or notes</p>
            </div>
          </Link>
        )}

        {/* GRID (Mobile First: 3 Cols, scaling up) */}
        <div className="w-full">
          {isFetching ? (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 w-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="shimmer rounded-lg bg-white p-1 shadow-sm w-full">
                  <div className="aspect-[4/3] w-full rounded bg-gray-200" />
                  <div className="mt-1 h-2 w-full rounded bg-gray-200" />
                  <div className="mt-1 h-2 w-2/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState icon={<BookOpen size={28} />} title="Library is empty" message="Be the first to share notes." actions={[{ label: "Share material", href: "/library/new", variant: "primary" }]} />
          ) : gridEntries.length === 0 ? (
            <EmptyState emoji="🔍" title="No matches" message="We couldn't find this right now." actions={[{ label: "Clear filters", onClick: handleClear, variant: "primary" }]} />
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 w-full">
              {gridEntries.map((entry) => (
                <LibraryCard key={entry.id} entry={entry} variant="vertical" isSaved={savedSet.has(entry.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <StudyVibesModal isOpen={showVibes} onClose={() => setShowVibes(false)} entries={entries} />
    </main>
  );
}