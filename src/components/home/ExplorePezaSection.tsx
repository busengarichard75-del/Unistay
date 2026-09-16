"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Home, Wrench, ShoppingBag, ArrowRight } from "lucide-react";

interface ExplorePezaSectionProps {
  onAccommodationSearch?: (query: string) => void;
}

// V1 keyword intent — basic matching, no AI.
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
      // Accommodation — filter the grid below
      if (onAccommodationSearch) onAccommodationSearch(trimmed);
    }
  };

  return (
    <section className="container-wide pt-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-6 sm:p-8">
        {/* Headline */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--nexora-navy)] sm:text-2xl">
            🎯 Find what you need
          </h2>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-gray-600">
            Rooms, services, and products — all in one place, near your campus.
          </p>
        </div>

        {/* Universal search */}
        <div className="mx-auto mt-5 max-w-xl">
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
              placeholder="Try: barber, room under 1500, used phone..."
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
          <p className="mt-2 text-center text-[11px] text-gray-400">
            We&apos;ll take you to the right section automatically
          </p>
        </div>

        {/* 3 tiles */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Tile
            href="/"
            icon={Home}
            title="Accommodation"
            line="Find a room near your campus"
            accent="from-blue-500 to-indigo-600"
          />
          <Tile
            href="/services"
            icon={Wrench}
            title="Services"
            line="Barbers, printing, repairs & more"
            accent="from-cyan-500 to-teal-600"
          />
          <Tile
            href="/marketplace"
            icon={ShoppingBag}
            title="Marketplace"
            line="Buy and sell with students"
            accent="from-orange-500 to-pink-600"
          />
        </div>
      </div>
    </section>
  );
}

function Tile({
  href,
  icon: Icon,
  title,
  line,
  accent,
}: {
  href: string;
  icon: typeof Home;
  title: string;
  line: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-md"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
      >
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--nexora-navy)]">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500 leading-snug">{line}</p>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--nexora-primary)]"
      />
    </Link>
  );
}