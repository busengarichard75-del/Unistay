"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";

interface RelatedListingsProps {
  /** Heading shown at the top of the sidebar. E.g. "More barbers near MUKUBA" */
  title: string;
  /** Small line under the heading. Optional. */
  subtitle?: string;

  /** The actual list of items to render. */
  children: ReactNode;

  /** How many items were rendered (for the count badge). Optional. */
  count?: number;

  /** Optional "See all" link at the bottom (e.g., "/services?cat=barber") */
  seeAllHref?: string;
  seeAllLabel?: string;

  /** Icon shown next to the title. Default: Sparkles */
  icon?: ReactNode;
}

/**
 * Pinterest-style sidebar for detail pages.
 *
 * Desktop: renders as a sticky column on the right (parent handles grid).
 * Mobile: renders below the main content as a compact grid (parent handles flow).
 *
 * This component only handles:
 *   - the heading
 *   - the layout of the child grid (2 cols)
 *   - the optional "See all" link
 *
 * Actual cards are passed as children so we reuse ServiceCard/ProductCard/etc.
 */
export function RelatedListings({
  title,
  subtitle,
  children,
  count,
  seeAllHref,
  seeAllLabel = "See all",
  icon,
}: RelatedListingsProps) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      {/* Header */}
      <div className="mb-3 flex items-start gap-2 border-b border-gray-100 pb-3">
        <span className="mt-0.5 shrink-0 text-[var(--nexora-primary)]">
          {icon || <Sparkles size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--nexora-navy)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>
          )}
        </div>
        {typeof count === "number" && count > 0 && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            {count}
          </span>
        )}
      </div>

      {/* Grid — 2 cols on all sizes (compact sidebar) */}
      <div className="grid grid-cols-2 gap-2">{children}</div>

      {/* See all */}
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="mt-3 flex items-center justify-center gap-1 rounded-full border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {seeAllLabel}
          <ChevronRight size={12} />
        </Link>
      )}
    </aside>
  );
}