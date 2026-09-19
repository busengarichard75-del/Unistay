"use client";

import { useRef } from "react";

interface CategoryTab {
  id: string;
  label: string;
  icon?: string;
}

interface CategoryTabsProps {
  categories: CategoryTab[];
  selected: string | null;
  onChange: (id: string | null) => void;
  /** Optional counts per category id — if provided, shows "(N)" next to label */
  counts?: Record<string, number>;
  /** If true, "All" tab is shown first (default: true) */
  showAll?: boolean;
  /** Label for the All tab (default: "All") */
  allLabel?: string;
  /**
   * Category ids to render as "coming soon" (empty).
   * These still render as tabs — but with a "Soon" pill and reduced opacity.
   */
  emptyCategoryIds?: Set<string>;
}

/**
 * Horizontal, sticky, scrollable tab strip for top-level categories.
 *
 * - Only renders categories you pass in.
 * - Active tab = filled primary.
 * - Empty categories (in `emptyCategoryIds`) render with a subtle "Soon" pill.
 * - Safe on SSR (no window access).
 */
export function CategoryTabs({
  categories,
  selected,
  onChange,
  counts,
  showAll = true,
  allLabel = "All",
  emptyCategoryIds,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalCount = counts
    ? Object.values(counts).reduce((a, b) => a + b, 0)
    : undefined;

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-gray-100 bg-[var(--nexora-surface)]/95 px-4 py-2 backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {showAll && (
          <Tab
            active={selected === null}
            onClick={() => onChange(null)}
            icon="🏷️"
            label={allLabel}
            count={totalCount}
          />
        )}

        {categories.map((c) => {
          const isEmpty = emptyCategoryIds?.has(c.id) ?? false;
          return (
            <Tab
              key={c.id}
              active={selected === c.id}
              onClick={() => onChange(c.id)}
              icon={c.icon}
              label={c.label}
              count={counts ? counts[c.id] : undefined}
              soon={isEmpty}
            />
          );
        })}
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
  count,
  soon = false,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  label: string;
  count?: number;
  soon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--nexora-primary)] text-white shadow-sm"
          : soon
          ? "border border-dashed border-gray-300 bg-white/60 text-gray-500 hover:bg-gray-50"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
      title={soon ? `${label} — coming soon` : label}
    >
      {icon && (
        <span
          className={`text-[13px] leading-none ${soon && !active ? "opacity-70" : ""}`}
        >
          {icon}
        </span>
      )}
      <span>{label}</span>

      {/* "Soon" pill for empty categories */}
      {soon && !active && (
        <span className="ml-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
          Soon
        </span>
      )}

      {/* Count badge for non-empty categories */}
      {!soon && typeof count === "number" && count > 0 && (
        <span
          className={`ml-0.5 text-[10px] font-semibold ${
            active ? "text-white/80" : "text-gray-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}