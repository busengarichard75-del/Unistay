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
import { getSavedSnapshot, getEmptySnapshot, subscribe } from "@/lib/savedLibrary";
import {
  Search, BookOpen, Plus, X, SlidersHorizontal, ChevronDown,
  Flame, Shuffle, Sparkles, Phone, Bookmark, ArrowRight, GraduationCap
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
  const gridEntries = spotlight ? filtered.filter((e) => e.id !== spotlight.id) : filtered;

  const handleClear = () => {
    setKeyword(""); setUniversityId(null); setCategory(null); setSort("random"); setShowSavedOnly(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#F1F5F9] w-[100vw] max-w-[100vw] overflow-x-hidden">
      <Navbar />

      {!isFetching && (
        <div className="w-full max-w-full overflow-x-auto bg-white border-b border-gray-200 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      <div className="w-full max-w-full px-3 py-4 flex flex-col gap-4">
        
        {/* SEARCH & FILTERS */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex w-full items-center rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <div className="pl-3 text-indigo-500">
              <Search size={16} className="shrink-0" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by title, course code, or keyword..."
              className="flex-1 w-full min-w-0 bg-transparent py-2.5 px-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            {keyword && (
              <button onClick={() => setKeyword("")} className="pr-3 text-gray-400 hover:text-gray-600">
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
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-colors border shadow-sm ${
                  showSavedOnly ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bookmark size={11} className={showSavedOnly ? "fill-white" : ""} />
                Saved
              </button>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="relative inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <SlidersHorizontal size={11} />
                <ChevronDown size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* HEADER & PHONE */}
        <div className="w-full mt-2">
          <h1 className="text-xl font-extrabold text-[var(--nexora-navy)] tracking-tight flex items-center gap-2">
            <GraduationCap size={22} className="text-indigo-600" /> Student Library
          </h1>
          <p className="text-xs text-gray-500 mt-1">Free academic resources shared by students, for students.</p>
          <a href="tel:+260767924893" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <Phone size={10} /> Library Manager · 0767 924 893
          </a>
        </div>

        {/* STUDY VIBES - Premium Indigo Gradient */}
        <button onClick={() => setShowVibes(true)} className="group w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 p-3 text-left shadow-md transition-all hover:from-indigo-500 hover:to-blue-500 hover:shadow-lg active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <div className="min-w-0 text-white">
              <p className="text-xs font-extrabold flex items-center gap-1.5">Study Vibes AI <span className="rounded bg-white/20 px-1 py-0 text-[8px] uppercase tracking-wider">New</span></p>
              <p className="text-[10px] text-white/90 truncate">Tell us your mood, we'll pick the perfect materials.</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-white/80 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* SPOTLIGHT - Featured Document */}
        {spotlight && (
          <Link href={`/library/${spotlight.id}`} className="group relative block w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-300">
            <div className="flex items-stretch">
              <div className="w-1.5 shrink-0 bg-indigo-600" />
              <div className="flex flex-1 flex-col justify-center p-3.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                  <Sparkles size={10} /> Document of the Day
                </div>
                <h2 className="line-clamp-1 text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{spotlight.title}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                  {getUniversityShortLabel(spotlight.universityId)}
                  {spotlight.courseCode && <><span>•</span>{spotlight.courseCode}</>}
                </p>
              </div>
              <div className="flex items-center justify-center pr-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                  <ArrowRight size={12} className="text-gray-400 group-hover:text-indigo-600" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* TRENDING */}
        {showTrending && (
          <div className="w-full max-w-full mt-1">
            <div className="mb-2 flex items-center gap-1.5 px-0.5">
              <Flame className="text-orange-500" size={14} />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Trending Resources</h2>
            </div>
            <div className="flex w-full snap-x gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trendingEntries.map((entry) => (
                <div key={entry.id} className="w-[170px] shrink-0 snap-start">
                  <LibraryCard entry={entry} variant="horizontal" isSaved={savedSet.has(entry.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHARE CTA */}
        {user && (
          <Link href="/library/new" className="w-full flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-300 active:scale-[0.99]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Plus size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900">Share a resource</p>
              <p className="text-[10px] text-gray-500 truncate">Upload past papers, notes, or guides.</p>
            </div>
          </Link>
        )}

        {/* GRID (Mobile First: 3 Cols, scaling up) */}
        <div className="w-full mt-1">
          {isFetching ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 w-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="shimmer rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-full">
                  <div className="aspect-[4/3] w-full rounded bg-gray-200" />
                  <div className="mt-1.5 h-2 w-full rounded bg-gray-200" />
                  <div className="mt-1 h-2 w-2/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState icon={<BookOpen size={28} />} title="Library is empty" message="Be the first to share notes." actions={[{ label: "Share material", href: "/library/new", variant: "primary" }]} />
          ) : gridEntries.length === 0 ? (
            <EmptyState emoji="🔍" title="No matches" message="We couldn't find this right now." actions={[{ label: "Clear filters", onClick: handleClear, variant: "primary" }]} />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 w-full">
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