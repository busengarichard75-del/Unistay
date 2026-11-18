// src/components/library/LibraryCard.tsx
"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Eye, MapPin, FileText, Flame, Bookmark } from "lucide-react";
import { LibraryEntry, getLibraryCategoryMeta } from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
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

  const metaParts: string[] = [];
  if (entry.year) metaParts.push(entry.year);
  if (entry.semester) metaParts.push(`S${entry.semester}`);
  const metaLine = metaParts.join(" · ");

  const isTrending = (entry.views || 0) > 50;

  const onToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(entry.id);
  };

  // ────────────────────────────────────────────────────────
  // HORIZONTAL (trending row — unchanged)
  // ────────────────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <Link
        href={`/library/${entry.id}`}
        className="group flex h-20 overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200"
      >
        <div
          className="relative w-20 shrink-0 overflow-hidden"
          style={{ background: art.background }}
        >
          {hasCover ? (
            <img
              src={coverImage!}
              alt={entry.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-white">
              <FileText size={20} className="drop-shadow-sm text-white/85" />
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-white/90">
                {cat?.label || "Material"}
              </span>
            </div>
          )}
        </div>

        <div className="relative flex flex-1 flex-col justify-between p-2 min-w-0">
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={isSaved ? "Remove from saved" : "Save for later"}
            className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform active:scale-90 hover:bg-white"
          >
            <Bookmark
              size={10}
              className={
                isSaved
                  ? "fill-[var(--nexora-primary)] text-[var(--nexora-primary)]"
                  : "text-gray-400"
              }
            />
          </button>

          <div className="pr-5">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="inline-flex items-center rounded bg-gray-100 px-1 py-0 text-[8px] font-bold uppercase text-gray-600 leading-tight">
                {cat?.label || "Material"}
              </span>
              {entry.courseCode && (
                <span className="truncate text-[9px] font-bold text-indigo-600">
                  {entry.courseCode}
                </span>
              )}
            </div>

            <h3 className="line-clamp-1 text-[11px] font-bold leading-tight text-gray-900 transition-colors group-hover:text-indigo-600">
              {entry.title}
            </h3>

            <p className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] leading-tight text-gray-500">
              <MapPin size={8} className="shrink-0" />
              <span className="truncate">
                {getUniversityShortLabel(entry.universityId)}
              </span>
              {metaLine && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="truncate">{metaLine}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] font-medium ${
                isTrending ? "text-orange-500" : "text-gray-400"
              }`}
            >
              {isTrending ? <Flame size={9} /> : <Eye size={9} />}
              {entry.views || 0}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 truncate text-[9px] text-gray-400">
              <span className="truncate max-w-[55px]">{entry.uploaderName}</span>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // ────────────────────────────────────────────────────────
  // VERTICAL — COMPACT THUMBNAIL (mobile-first)
  // ────────────────────────────────────────────────────────
  return (
    <Link
      href={`/library/${entry.id}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md active:scale-[0.98]"
    >
      {/* Square image — compact thumbnail */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: art.background }}
      >
        {hasCover ? (
          <img
            src={coverImage!}
            alt={entry.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-white">
            <FileText size={20} className="drop-shadow-md text-white/85" />
            <span className="mt-0.5 text-[6px] font-bold uppercase tracking-widest text-white/90 px-0.5 text-center leading-tight">
              {cat?.label || "Material"}
            </span>
          </div>
        )}

        {/* Bookmark — tiny, corner */}
        <button
          type="button"
          onClick={onToggleSave}
          aria-label={isSaved ? "Remove from saved" : "Save for later"}
          className="absolute top-0.5 right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform active:scale-90 hover:bg-white"
        >
          <Bookmark
            size={9}
            className={
              isSaved
                ? "fill-[var(--nexora-primary)] text-[var(--nexora-primary)]"
                : "text-gray-500"
            }
          />
        </button>

        {/* Meta badge — only if year/semester exists */}
        {metaLine && (
          <span className="absolute left-0.5 top-0.5 inline-flex items-center rounded bg-black/55 px-1 py-0 text-[6px] font-bold leading-tight text-white backdrop-blur-sm">
            {metaLine}
          </span>
        )}
      </div>

      {/* Content — ultra tight */}
      <div className="px-1.5 py-1">
        <h3
          className="line-clamp-2 text-[9px] font-semibold leading-[1.15] text-gray-900 transition-colors group-hover:text-indigo-600"
          title={entry.title}
        >
          {entry.title}
        </h3>

        {entry.courseCode && (
          <p className="mt-0.5 truncate text-[8px] font-bold leading-tight text-indigo-600">
            {entry.courseCode}
          </p>
        )}

        <p className="mt-0.5 flex items-center gap-0.5 truncate text-[7px] leading-tight text-gray-500">
          <MapPin size={7} className="shrink-0" />
          <span className="truncate">
            {getUniversityShortLabel(entry.universityId)}
          </span>
        </p>

        <div className="mt-1 flex items-center justify-between gap-0.5">
          <span
            className={`inline-flex items-center gap-0.5 text-[7px] font-medium ${
              isTrending ? "text-orange-500" : "text-gray-400"
            }`}
          >
            {isTrending ? <Flame size={7} /> : <Eye size={7} />}
            {entry.views || 0}
          </span>
          {entry.createdAt && (
            <span className="shrink-0 text-[7px] text-gray-400">
              {timeAgo(entry.createdAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});