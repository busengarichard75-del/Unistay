"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Clock } from "lucide-react";

interface ListingSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  storageKey: string;
}

export function ListingSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  storageKey,
}: ListingSearchBarProps) {
  const [showRecents, setShowRecents] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setRecents(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowRecents(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const saveRecent = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recents.filter((s) => s !== term.trim())].slice(0, 5);
    setRecents(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSubmit = () => {
    saveRecent(value);
    setShowRecents(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-0 overflow-hidden rounded-full border-2 border-[var(--nexora-primary)] bg-white shadow-lg transition-all focus-within:ring-4 focus-within:ring-[var(--nexora-primary)]/20">
        <div className="flex items-center gap-2 pl-4 pr-1 text-[var(--nexora-primary)]">
          <Search size={18} className="shrink-0" />
        </div>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowRecents(true);
          }}
          onFocus={() => setShowRecents(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 pr-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              setShowRecents(false);
            }}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="m-1 rounded-full bg-[var(--nexora-primary)] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
        >
          Search
        </button>
      </div>

      {showRecents && !value.trim() && recents.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-[var(--nexora-primary)]/20 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-medium text-[var(--nexora-primary)]">
            Recent searches
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {recents.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(search);
                  setShowRecents(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 transition-colors hover:bg-[var(--nexora-primary)]/5"
              >
                <Clock size={14} className="shrink-0 text-[var(--nexora-primary)]" />
                <span>{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}