"use client";

import Link from "next/link";
import { Eye, Upload, MapPin, FileText } from "lucide-react";
import {
  LibraryEntry,
  getLibraryCategoryMeta,
} from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";

interface LibraryCardProps {
  entry: LibraryEntry;
}

export function LibraryCard({ entry }: LibraryCardProps) {
  const cat = getLibraryCategoryMeta(entry.category);
  const hasCover = !!entry.coverImageUrl;

  // Build a compact meta line: "CS101 · 2024 · Sem 1"
  const metaParts: string[] = [];
  if (entry.courseCode) metaParts.push(entry.courseCode);
  if (entry.year) metaParts.push(entry.year);
  if (entry.semester) metaParts.push(`Sem ${entry.semester}`);
  const metaLine = metaParts.join(" · ");

  return (
    <Link
      href={`/library/${entry.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* ─── Cover ─── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
        {hasCover ? (
          <img
            src={entry.coverImageUrl}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-white">
            <span className="text-4xl drop-shadow-sm">{cat?.icon || "📚"}</span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {cat?.label || "Material"}
            </span>
          </div>
        )}

        {/* Category pill (top-left) */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
          {cat?.icon} {cat?.label}
        </span>

        {/* Year/semester pill (top-right) */}
        {(entry.year || entry.semester) && (
          <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
            {entry.year || ""}
            {entry.year && entry.semester ? " · " : ""}
            {entry.semester ? `S${entry.semester}` : ""}
          </span>
        )}
      </div>

      {/* ─── Body ─── */}
      <div className="p-3">
        {/* Title (2 lines max) */}
        <h3
          className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900"
          title={entry.title}
        >
          {entry.title}
        </h3>

        {/* Meta line */}
        {metaLine && (
          <p className="mt-1 truncate text-[11px] font-medium text-indigo-600">
            {metaLine}
          </p>
        )}

        {/* University */}
        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-500">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">
            {getUniversityShortLabel(entry.universityId)}
          </span>
        </p>

        {/* Bottom row: stats + uploader + time */}
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
            <Eye size={10} />
            {entry.views || 0}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 truncate text-[10px] text-gray-400">
            <Upload size={10} className="shrink-0" />
            <span className="truncate">{entry.uploaderName}</span>
          </span>
          {entry.createdAt && (
            <span className="shrink-0 text-[10px] text-gray-400">
              {timeAgo(entry.createdAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}