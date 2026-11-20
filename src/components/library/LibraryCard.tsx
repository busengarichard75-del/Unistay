// src/components/library/LibraryCard.tsx
"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { MapPin, FileText, Bookmark, BookOpen } from "lucide-react";
import { LibraryEntry, getLibraryCategoryMeta } from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { optimizeCardImage } from "@/lib/imageUrl";
import { getCoverArt } from "@/lib/coverArt";
import { toggleSaved } from "@/lib/savedLibrary";

interface LibraryCardProps {
  entry: LibraryEntry;
  variant?: "vertical" | "horizontal";
  isSaved?: boolean;
}

export const LibraryCard = memo(function LibraryCard({
  entry,
  variant = "vertical",
  isSaved = false,
}: LibraryCardProps) {
  const cat = getLibraryCategoryMeta(entry.category);
  const coverImage = entry.coverImageUrl
    ? optimizeCardImage(entry.coverImageUrl)
    : null;
  const hasCover = !!coverImage;

  const art = useMemo(
    () => getCoverArt(entry.id, entry.category),
    [entry.id, entry.category]
  );

  const onToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(entry.id);
  };

  // ────────────────────────────────────────────────────────
  // HORIZONTAL (Trending row)
  // ────────────────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <Link
        href={`/library/${entry.id}`}
        className="group flex h-[72px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
      >
        <div className={`relative flex w-16 shrink-0 items-center justify-center bg-gradient-to-br ${art.gradient}`}>
          {/* Glossy shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
          
          {hasCover ? (
            <img src={coverImage!} alt={entry.title} className="relative z-10 h-full w-full object-cover" />
          ) : (
            <FileText size={18} className={art.iconColor} />
          )}
        </div>
        
        <div className="relative flex flex-1 flex-col justify-center p-2 min-w-0">
          <button
            type="button"
            onClick={onToggleSave}
            className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md border border-gray-100 bg-white shadow-sm hover:bg-gray-50 active:scale-90"
          >
            <Bookmark size={10} className={isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"} />
          </button>
          
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              {cat?.label || "Material"}
            </span>
            {entry.courseCode && (
              <span className="rounded bg-indigo-50 px-1 py-0 text-[8px] font-bold text-indigo-700">
                {entry.courseCode}
              </span>
            )}
          </div>
          
          <h3 className="line-clamp-1 text-[11px] font-bold text-gray-900 pr-6">
            {entry.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] font-medium text-gray-500">
            <MapPin size={8} className="shrink-0" />
            <span className="truncate">{getUniversityShortLabel(entry.universityId)}</span>
          </p>
        </div>
      </Link>
    );
  }

  // ────────────────────────────────────────────────────────
  // VERTICAL (Grid) — Premium High Contrast
  // ────────────────────────────────────────────────────────
  return (
    <Link
      href={`/library/${entry.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg active:scale-[0.98] h-full"
    >
      {/* Solid Color Cover with Glossy shine */}
      <div className={`relative aspect-[4/3] w-full overflow-hidden shrink-0 bg-gradient-to-br ${art.gradient}`}>
        
        {/* The subtle glossy "shine" that makes it look premium */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-white/10 to-white/30 opacity-60" />
        
        {hasCover ? (
          <img
            src={coverImage!}
            alt={entry.title}
            loading="lazy"
            className="relative z-10 h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center transition-transform duration-500 group-hover:scale-110">
            <BookOpen size={26} className={`${art.iconColor} drop-shadow-md`} />
            <span className={`mt-1.5 text-[9px] font-extrabold uppercase tracking-widest ${art.iconColor} opacity-90`}>
              {cat?.label || "Material"}
            </span>
          </div>
        )}

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={onToggleSave}
          className="absolute top-1.5 right-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-md border border-black/10 bg-white/90 shadow-sm backdrop-blur-sm transition-transform active:scale-90 hover:bg-white"
        >
          <Bookmark
            size={10}
            className={isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-500"}
          />
        </button>
      </div>

      {/* Pure White Content Area */}
      <div className="flex flex-1 flex-col justify-between p-2.5">
        <div>
          <h3 className="line-clamp-2 text-[11px] font-bold leading-[1.2] text-gray-900 group-hover:text-indigo-600 transition-colors">
            {entry.title}
          </h3>
          {entry.courseCode && (
            <span className="mt-1.5 inline-block rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[8px] font-bold text-gray-700">
              {entry.courseCode}
            </span>
          )}
        </div>
        
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5">
          <p className="flex items-center gap-0.5 truncate text-[8px] font-semibold text-gray-500">
            <MapPin size={7} className="shrink-0" />
            <span className="truncate">{getUniversityShortLabel(entry.universityId)}</span>
          </p>
          <span className="text-[7px] font-medium text-gray-400">{entry.year || ""}</span>
        </div>
      </div>
    </Link>
  );
});