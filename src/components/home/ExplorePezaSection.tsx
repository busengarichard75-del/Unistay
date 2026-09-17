"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Wrench, ShoppingBag, Map as MapIcon, ArrowRight } from "lucide-react";

interface ExplorePezaSectionProps {
  onAccommodationSearch?: (query: string) => void;
}

const SERVICE_KEYWORDS = [
  "barber", "salon", "haircut", "print", "printing", "photo", "photography",
  "repair", "tech", "food", "meal", "catering", "transport", "delivery",
  "clean", "laundry", "service", "tutor", "help",
];

const PRODUCT_KEYWORDS = [
  "phone", "laptop", "buy", "sell", "furniture", "book", "books",
  "table", "chair", "marketplace", "product", "used", "second",
  "cheap", "deal", "sale", "gadget", "electronic",
];

function detectIntent(query: string): "accommodation" | "services" | "marketplace" {
  const q = query.toLowerCase();
  if (SERVICE_KEYWORDS.some((k) => q.includes(k))) return "services";
  if (PRODUCT_KEYWORDS.some((k) => q.includes(k))) return "marketplace";
  return "accommodation";
}

export function ExplorePezaSection({ onAccommodationSearch }: ExplorePezaSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const intent = detectIntent(trimmed);

    if (intent === "services") {
      router.push(`/services?q=${encodeURIComponent(trimmed)}`);
    } else if (intent === "marketplace") {
      router.push(`/marketplace?q=${encodeURIComponent(trimmed)}`);
    } else {
      if (onAccommodationSearch) onAccommodationSearch(trimmed);
    }
  };

  return (
    <section className="container-wide pt-3 sm:pt-4">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-[var(--nexora-navy)] sm:text-2xl">
            🎯 Find what you need
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-xs text-gray-600 sm:mt-1.5 sm:text-sm">
            Services, products, and everything on the map — near your campus.
          </p>
        </div>

        <div className="mx-auto mt-3 max-w-xl sm:mt-4">
          <div className="flex items-center gap-0 overflow-hidden rounded-full border-2 border-[var(--nexora-primary)] bg-white shadow-md focus-within:ring-4 focus-within:ring-[var(--nexora-primary)]/20">
            <div className="flex items-center gap-2 pl-4 pr-1 text-[var(--nexora-primary)]">
              <Search size={18} className="shrink-0" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Try: barber, used phone, room under 1500..."
              className="flex-1 bg-transparent py-3 pr-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="m-1 rounded-full bg-[var(--nexora-primary)] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50"
            >
              Search
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-gray-400">
            We&apos;ll take you to the right section automatically
          </p>
        </div>

        {/* 3 compact tiles — Services · Peza Map · Marketplace */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <CompactTile
            href="/services"
            icon={Wrench}
            title="Services"
            line="Barbers, printing, repairs"
            accent="from-cyan-500 to-teal-600"
          />
          <CompactTile
            href="/map"
            icon={MapIcon}
            title="Peza Map"
            line="See what's around you"
            accent="from-emerald-500 to-green-600"
          />
          <CompactTile
            href="/marketplace"
            icon={ShoppingBag}
            title="Marketplace"
            line="Buy & sell with students"
            accent="from-orange-500 to-pink-600"
          />
        </div>
      </div>
    </section>
  );
}

function CompactTile({
  href,
  icon: Icon,
  title,
  line,
  accent,
}: {
  href: string;
  icon: typeof Wrench;
  title: string;
  line: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-2.5 text-center transition-all hover:border-gray-200 hover:shadow-sm sm:flex-row sm:gap-3 sm:p-3 sm:text-left"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm sm:h-10 sm:w-10`}
      >
        <Icon size={16} className="sm:hidden" />
        <Icon size={18} className="hidden sm:block" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold leading-tight text-[var(--nexora-navy)] sm:text-sm">
          {title}
        </p>
        <p className="mt-0.5 hidden text-[11px] leading-snug text-gray-500 sm:block sm:truncate">
          {line}
        </p>
      </div>
      <ArrowRight
        size={14}
        className="hidden shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--nexora-primary)] sm:block"
      />
    </Link>
  );
}