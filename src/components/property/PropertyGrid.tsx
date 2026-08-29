"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import { Property } from "@/types/property";
import { universities } from "@/data/universities";

interface PropertyGridProps {
  properties: Property[];
}

const PREVIEW_COUNT = 3;

interface Group {
  key: string;
  displayName: string;
  items: Property[];
}

const universityNameById: Record<string, string> = Object.fromEntries(
  universities.map((university) => [university.id, university.name])
);

const headingTemplates = [
  (name: string) => `Stay close to ${name}`,
  (name: string) => `Popular near ${name}`,
  (name: string) => `Top places around ${name}`,
  (name: string) => `Accommodation near ${name}`,
  (name: string) => `Explore stays near ${name}`,
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getHeading(name: string): string {
  const template = headingTemplates[hashString(name) % headingTemplates.length];
  return template(name);
}

function getGroupKey(property: Property): string {
  if (property.universityId?.trim()) {
    return `university:${property.universityId}`;
  }
  return `location:${property.location.trim().toLowerCase()}`;
}

function getGroupName(property: Property): string {
  if (property.universityId?.trim()) {
    return (
      universityNameById[property.universityId] ||
      `University ${property.universityId.slice(0, 6)}`
    );
  }
  return property.location.split(",")[0]?.trim() || "Other locations";
}

export default function PropertyGrid({ properties }: PropertyGridProps) {
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  const groups = useMemo<Group[]>(() => {
    const visibleProperties = properties.filter(
      (property) => property.isActive !== false
    );

    const grouped = new Map<string, Group>();

    for (const property of visibleProperties) {
      const key = getGroupKey(property);

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          displayName: getGroupName(property),
          items: [],
        });
      }

      grouped.get(key)!.items.push(property);
    }

    return Array.from(grouped.values());
  }, [properties]);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        No properties available yet.
      </div>
    );
  }

  const activeGroup = activeGroupKey
    ? groups.find((group) => group.key === activeGroupKey)
    : null;

  // ─── GROUP DETAIL VIEW (after tapping "View more") ───────────────
  if (activeGroup) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setActiveGroupKey(null)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-[var(--nexora-primary)] transition-colors hover:bg-blue-50"
        >
          <ArrowLeft size={16} />
          All universities
        </button>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            {activeGroup.displayName}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {activeGroup.items.length}{" "}
            {activeGroup.items.length === 1 ? "property" : "properties"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {activeGroup.items.map((property) => (
            <PropertyCard key={property.id} property={property} compact />
          ))}
        </div>
      </div>
    );
  }

  // ─── HOMEPAGE VIEW (grouped previews, no horizontal scroll) ──────
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <GroupPreview
          key={group.key}
          group={group}
          onShowAll={() => setActiveGroupKey(group.key)}
        />
      ))}
    </div>
  );
}

interface GroupPreviewProps {
  group: Group;
  onShowAll: () => void;
}

function GroupPreview({ group, onShowAll }: GroupPreviewProps) {
  const hasMore = group.items.length > PREVIEW_COUNT;
  const previewItems = group.items.slice(0, PREVIEW_COUNT);
  const remainingCount = group.items.length - PREVIEW_COUNT;

  return (
    <section className="min-w-0">
      {/* Section header */}
      <div className="mb-4 px-1">
        <h2 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          {getHeading(group.displayName)}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
          {group.items.length} {group.items.length === 1 ? "property" : "properties"}
        </p>
      </div>

      {/* Preview grid: up to 3 cards + a "View more" card in the 4th slot */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-7">
        {previewItems.map((property) => (
          <PropertyCard key={property.id} property={property} compact />
        ))}

        {hasMore && (
          <ViewMoreCard remainingCount={remainingCount} onClick={onShowAll} />
        )}
      </div>
    </section>
  );
}

interface ViewMoreCardProps {
  remainingCount: number;
  onClick: () => void;
}

function ViewMoreCard({ remainingCount, onClick }: ViewMoreCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block min-w-0 touch-manipulation text-left"
    >
      <div className="relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl bg-[var(--nexora-surface)] text-center transition-colors group-hover:bg-blue-50">
        <ArrowRight
          size={20}
          className="text-[var(--nexora-primary)] transition-transform duration-200 group-hover:translate-x-1"
        />
        <span className="text-[13px] font-semibold text-gray-900">View more</span>
        <span className="text-[11px] text-gray-500">
          {remainingCount} more {remainingCount === 1 ? "property" : "properties"}
        </span>
      </div>
    </button>
  );
}