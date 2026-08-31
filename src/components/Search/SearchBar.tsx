"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Home } from "lucide-react";
import { Property } from "@/types/property";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  properties?: Property[];
  onSearch?: (value: string) => void;
}

export function SearchBar({ value, onChange, properties = [], onSearch }: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter((s) => s !== term.trim())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = (term: string) => {
    if (term.trim()) {
      saveRecentSearch(term.trim());
      onChange(term);
      if (onSearch) onSearch(term);
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    onChange("");
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSuggestions = (): string[] => {
    const input = value.trim().toLowerCase();
    if (!input) return [];

    const propertyMatches = properties
      .filter((p) => p.title.toLowerCase().includes(input) || p.location.toLowerCase().includes(input))
      .map((p) => p.title)
      .slice(0, 4);

    const recentMatches = recentSearches
      .filter((s) => s.toLowerCase().includes(input) && s.toLowerCase() !== input)
      .slice(0, 2);

    const combined = [...recentMatches, ...propertyMatches];
    return [...new Set(combined)];
  };

  const suggestions = getSuggestions();

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* ─── Search Bar – White with Blue Border ─── */}
      <div className="flex items-center gap-0 overflow-hidden rounded-full border-2 border-[var(--nexora-primary)] bg-white shadow-lg transition-all focus-within:ring-4 focus-within:ring-[var(--nexora-primary)]/20">
        <div className="flex items-center gap-2 pl-4 pr-1 text-[var(--nexora-primary)]">
          <Search size={18} className="shrink-0" />
        </div>

        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search by location or property name..."
          className="flex-1 bg-transparent py-3 pr-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />

        {value && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        <button
          onClick={() => handleSearch(value)}
          className="m-1 rounded-full bg-[var(--nexora-primary)] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
        >
          Search
        </button>
      </div>

      {/* ─── Suggestions dropdown ─── */}
      {showSuggestions && value.trim() && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl bg-white shadow-xl border border-[var(--nexora-primary)]/20">
          <div className="max-h-80 overflow-y-auto py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-[var(--nexora-primary)]/5 transition-colors"
              >
                <Home size={14} className="text-[var(--nexora-primary)] shrink-0" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Recent searches ─── */}
      {showSuggestions && !value.trim() && recentSearches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl bg-white shadow-xl border border-[var(--nexora-primary)]/20">
          <div className="px-4 py-2.5 text-xs font-medium text-[var(--nexora-primary)] border-b border-gray-100">
            Recent searches
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(search)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-[var(--nexora-primary)]/5 transition-colors"
              >
                <Clock size={14} className="text-[var(--nexora-primary)] shrink-0" />
                <span>{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}