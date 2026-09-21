"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
            Rooms, services, products, study materials — everything you need on
            campus.
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
      </div>
    </section>
  );
}