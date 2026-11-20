// src/components/library/LibraryCard.tsx
"use client";

import { memo } from "react";
import Link from "next/link";
import { MapPin, FileText, Bookmark } from "lucide-react";
import { LibraryEntry, getLibraryCategoryMeta } from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { optimizeCardImage } from "@/lib/imageUrl";
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
        className="group flex h-[72px] w-full overflow-hidden rounded-xl border border-[#D6E4F0] bg-white shadow-sm transition-all hover:border-[#4A90D9]/50 hover:shadow-md"
      >
        {/* Soft Milky Sky Blue Image Area */}
        <div className="relative flex w-16 shrink-0 items-center justify-center overflow-hidden bg-[#F4F9FD]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-blue-100/30 backdrop-blur-sm" />
          
          {hasCover ? (
            <img src={coverImage!} alt={entry.title} className="relative z-10 h-full w-full object-cover opacity-90" />
          ) : (
            <FileText size={18} className="relative z-10 text-[#4A90D9]/60" />
          )}
        </div>
        
        <div className="relative flex flex-1 flex-col justify-center p-2 min-w-0">
          <button
            type="button"
            onClick={onToggleSave}
            className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-md border border-gray-100 bg-white shadow-sm hover:bg-gray-50 active:scale-90"
          >
            <Bookmark size={10} className={isSaved ? "fill-[#4A90D9] text-[#4A90D9]" : "text-gray-400"} />
          </button>
          
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#4A90D9]">
              {cat?.label || "Material"}
            </span>
            {entry.courseCode && (
              <span className="rounded bg-[#F4F9FD] px-1 py-0 text-[8px] font-bold text-[#2563EB]">
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
  // VERTICAL (Grid) — The Milk Smooth Design
  // ────────────────────────────────────────────────────────
  return (
    <Link
      href={`/library/${entry.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#D6E4F0] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#4A90D9]/50 hover:shadow-md active:scale-[0.98] h-full"
    >
      {/* White Glassy Sky Blue Image Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0 bg-[#F4F9FD]">
        
        {/* Subtle blue gradient and glass blur */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/50 to-blue-100/40 backdrop-blur-[2px]" />

        {hasCover ? (
          <img
            src={coverImage!}
            alt={entry.title}
            loading="lazy"
            className="relative z-20 h-full w-full object-cover opacity-95 transition-opacity group-hover:opacity-100"
          />
        ) : (
          <div className="relative z-20 flex h-full w-full flex-col items-center justify-center transition-transform group-hover:scale-105 duration-500">
            <FileText size={24} className="text-[#4A90D9]/60 drop-shadow-sm" />
            <span className="mt-1.5 text-[8px] font-extrabold uppercase tracking-widest text-[#4A90D9]/80">
              {cat?.label || "Material"}
            </span>
          </div>
        )}

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={onToggleSave}
          className="absolute top-1.5 right-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-md border border-white/80 bg-white/90 shadow-sm backdrop-blur-md transition-transform active:scale-90 hover:bg-white"
        >
          <Bookmark
            size={10}
            className={isSaved ? "fill-[#4A90D9] text-[#4A90D9]" : "text-gray-500"}
          />
        </button>
      </div>

      {/* Clean White Content Area */}
      <div className="flex flex-1 flex-col justify-between p-2">
        <div>
          <h3 className="line-clamp-2 text-[10px] font-bold leading-[1.2] text-gray-900 group-hover:text-[#4A90D9] transition-colors">
            {entry.title}
          </h3>
          {entry.courseCode && (
            <span className="mt-1 inline-block rounded border border-[#D6E4F0] bg-[#F4F9FD] px-1 py-0 text-[8px] font-bold text-[#2563EB]">
              {entry.courseCode}
            </span>
          )}
        </div>
        
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5">
          <p className="flex items-center gap-0.5 truncate text-[8px] font-medium text-gray-500">
            <MapPin size={7} className="shrink-0 text-[#4A90D9]/70" />
            <span className="truncate">{getUniversityShortLabel(entry.universityId)}</span>
          </p>
          <span className="text-[7px] font-medium text-gray-400">{entry.year || ""}</span>
        </div>
      </div>
    </Link>
  );
});