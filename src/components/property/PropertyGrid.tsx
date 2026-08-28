"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { PropertyCard } from "./PropertyCard";
import { Property } from "@/types/property";
import { universities } from "@/data/universities";

interface PropertyGridProps {
  properties: Property[];
}

const CARDS_PER_GROUP = 6;

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

export function PropertyGrid({ properties }: PropertyGridProps) {
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

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <PropertyRow key={group.key} group={group} onShowAll={() => setActiveGroupKey(group.key)} />
      ))}
    </div>
  );
}

interface PropertyRowProps {
  group: Group;
  onShowAll: () => void;
}

function PropertyRow({ group, onShowAll }: PropertyRowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    containScroll: "trimSnaps",
    dragFree: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 640px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 },
    },
  });

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const updateScrollState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollLeft(emblaApi.canScrollPrev());
    setCanScrollRight(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollState();
    emblaApi.on("select", updateScrollState);
    emblaApi.on("reInit", updateScrollState);

    return () => {
      emblaApi.off("select", updateScrollState);
      emblaApi.off("reInit", updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  const scrollRow = (direction: "left" | "right") => {
    if (!emblaApi) return;
    if (direction === "left") {
      emblaApi.scrollPrev();
    } else {
      emblaApi.scrollNext();
    }
  };

  const showNavigation = group.items.length > 3 || canScrollLeft || canScrollRight;

  return (
    <section className="group/section min-w-0">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            {getHeading(group.displayName)}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            {group.items.length} {group.items.length === 1 ? "property" : "properties"}
          </p>
        </div>

        {group.items.length > CARDS_PER_GROUP && (
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 hover:text-[var(--nexora-primary)]"
          >
            Show all
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Carousel row */}
      <div
        className="relative min-w-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left edge fade */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-[var(--nexora-surface)] to-transparent transition-opacity duration-200 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Right edge fade */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-[var(--nexora-surface)] to-transparent transition-opacity duration-200 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Left arrow */}
        {showNavigation && canScrollLeft && (
          <button
            type="button"
            aria-label={`Scroll ${group.displayName} properties left`}
            onClick={() => scrollRow("left")}
            className={`absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-md transition-all duration-200 hover:scale-105 hover:bg-gray-50 ${
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <ArrowLeft size={17} />
          </button>
        )}

        {/* Right arrow */}
        {showNavigation && canScrollRight && (
          <button
            type="button"
            aria-label={`Scroll ${group.displayName} properties right`}
            onClick={() => scrollRow("right")}
            className={`absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-md transition-all duration-200 hover:scale-105 hover:bg-gray-50 ${
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <ArrowRight size={17} />
          </button>
        )}

        {/* Embla Carousel container */}
        <div ref={emblaRef} className="overflow-x-hidden">
          <div className="flex gap-2">
            {group.items.map((property) => (
              <div
                key={property.id}
                className="
                  min-w-[110px]
                  flex-shrink-0
                  sm:min-w-[140px]
                  md:min-w-[150px]
                  lg:min-w-[160px]
                  xl:min-w-[170px]
                "
                style={{ flex: "0 0 auto" }}
              >
                <PropertyCard property={property} compact />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}