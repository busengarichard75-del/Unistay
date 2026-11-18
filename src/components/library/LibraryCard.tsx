// src/components/library/LibraryCard.tsx
"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { MapPin, FileText, Bookmark } from "lucide-react";
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
        className="group flex h-[72px] w-full overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100"
      >
        <div
          className="relative w-16 shrink-0 overflow-hidden"
          style={{ background: art.background }}
        >
          {hasCover ? (
            <img src={coverImage!} alt={entry.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white">
              <FileText size={16} className="text-white/80" />
            </div>
          )}
        </div>
        <div className="relative flex flex-1 flex-col justify-center p-2 min-w-0">
          <button
            type="button"
            onClick={onToggleSave}
            className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gray-50 active:scale-90"
          >
            <Bookmark size={10} className={isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"} />
          </button>
          <span className="text-[9px] font-bold uppercase text-gray-500 truncate">
            {cat?.label || "Material"}
          </span>
          <h3 className="line-clamp-1 text-[11px] font-bold text-gray-900 pr-5">
            {entry.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-gray-500">
            <MapPin size={8} className="shrink-0" />
            <span className="truncate">{getUniversityShortLabel(entry.universityId)}</span>
          </p>
        </div>
      </Link>
    );
  }

  // ────────────────────────────────────────────────────────
  // VERTICAL (Grid) — BARE MINIMUM FOR MOBILE
  // ────────────────────────────────────────────────────────
  return (
    <Link
      href={`/library/${entry.id}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100 h-full transition-transform active:scale-[0.98]"
    >
      {/* Image: aspect-[4/3] makes it wider but shorter than a square */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden shrink-0"
        style={{ background: art.background }}
      >
        {hasCover ? (
          <img
            src={coverImage!}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-white">
            <FileText size={18} className="text-white/80" />
          </div>
        )}

        <button
          type="button"
          onClick={onToggleSave}
          className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm active:scale-90"
        >
          <Bookmark
            size={10}
            className={isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-500"}
          />
        </button>
      </div>

      {/* Content: Extremely tight */}
      <div className="flex flex-1 flex-col justify-between p-1.5">
        <div>
          <h3 className="line-clamp-2 text-[10px] font-bold leading-[1.15] text-gray-900">
            {entry.title}
          </h3>
          {entry.courseCode && (
            <p className="mt-0.5 truncate text-[9px] font-bold text-indigo-600 leading-tight">
              {entry.courseCode}
            </p>
          )}
        </div>
        
        <p className="mt-1 flex items-center gap-0.5 truncate text-[8px] font-medium text-gray-500 leading-tight">
          <MapPin size={7} className="shrink-0" />
          <span className="truncate">{getUniversityShortLabel(entry.universityId)}</span>
        </p>
      </div>
    </Link>
  );
});