// src/app/find-my-best-house/results/page.tsx
"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertTriangle, Filter } from "lucide-react";
import { getAllProperties } from "@/services/propertyService";
import { recommendProperties } from "@/lib/recommendation/engine";
import { Preferences, ScoredProperty } from "@/lib/recommendation/types";
import { PropertyCard } from "@/components/property/PropertyCard";

type SortMode = "match" | "price_low" | "price_high" | "newest";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scoredProperties, setScoredProperties] = useState<ScoredProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [sort, setSort] = useState<SortMode>("match");
  const [onlyGoodMatches, setOnlyGoodMatches] = useState(false);

  useEffect(() => {
    const prefsParam = searchParams.get("prefs");
    if (!prefsParam) {
      router.push("/");
      return;
    }

    try {
      const prefs = JSON.parse(decodeURIComponent(prefsParam)) as Preferences;
      setPreferences(prefs);

      const fetchProperties = async () => {
        try {
          const properties = await getAllProperties();
          const results = recommendProperties(properties, prefs);
          setScoredProperties(results);
        } catch {
          setError("Failed to load properties. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchProperties();
    } catch {
      router.push("/");
    }
  }, [searchParams, router]);

  const displayed = useMemo(() => {
    let list = [...scoredProperties];
    if (onlyGoodMatches) list = list.filter((s) => s.score >= 70);

    if (sort === "price_low") list.sort((a, b) => a.property.price - b.property.price);
    else if (sort === "price_high") list.sort((a, b) => b.property.price - a.property.price);
    else if (sort === "newest") list.sort((a, b) => (b.property.createdAt || 0) - (a.property.createdAt || 0));
    else list.sort((a, b) => b.score - a.score);

    return list;
  }, [scoredProperties, sort, onlyGoodMatches]);

  const activeFilterCount =
    (preferences?.budgetMax ? 1 : 0) +
    (preferences?.maxWalkingMinutes ? 1 : 0) +
    (preferences?.mustHaves?.length || 0) +
    (preferences?.comforts?.length || 0) +
    (preferences?.universityId ? 1 : 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
        <div className="container-medium text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-blue-100">
            <Sparkles size={20} className="text-[var(--nexora-primary)]" />
          </div>
          <p className="text-sm text-gray-500">Finding your best matches...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
        <div className="container-medium text-center">
          <p className="text-red-500">{error}</p>
          <Link href="/" className="text-[var(--nexora-primary)] hover:underline text-sm mt-2 inline-block">
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  if (scoredProperties.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
        <div className="container-medium">
          <div className="card-premium p-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-[var(--nexora-navy)]">
              We couldn't find matches with your filters
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Try widening your budget or removing a must-have.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/?openModal=true"
                className="rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
              >
                Adjust preferences
              </Link>
              <Link
                href="/"
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Browse all
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-8">
      <div className="container-medium">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--nexora-navy)]">
              🧭 Your Best Matches
            </h1>
            <p className="text-xs text-gray-500">
              {scoredProperties.length} properties scored against{" "}
              {activeFilterCount} of your preferences
            </p>
          </div>
        </div>

        {/* Sort + Filter bar */}
        <div className="card-premium p-3 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Sort:</span>
            {[
              { v: "match", l: "Best match" },
              { v: "price_low", l: "Price ↑" },
              { v: "price_high", l: "Price ↓" },
              { v: "newest", l: "Newest" },
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setSort(v as SortMode)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === v
                    ? "bg-[var(--nexora-primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOnlyGoodMatches((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              onlyGoodMatches
                ? "bg-[var(--nexora-primary)] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter size={12} />
            {onlyGoodMatches ? "70%+ only" : "Show all"}
          </button>
        </div>

        {/* Results */}
        {displayed.length === 0 ? (
          <div className="card-premium p-8 text-center">
            <p className="text-sm text-gray-500">
              No properties scored 70%+. Toggle off the filter to see all matches.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((scored, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={scored.property.id}
                  className="card-premium overflow-hidden"
                >
                  <div className="p-4">
                    {/* Match score header */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                            rank === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : rank === 2
                              ? "bg-gray-100 text-gray-700"
                              : rank === 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                        </span>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                            Match score
                          </p>
                          <p className="text-2xl font-bold text-[var(--nexora-primary)]">
                            {scored.score}%
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/property/${scored.property.id}`}
                        className="rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
                      >
                        View →
                      </Link>
                    </div>

                    {/* Property card */}
                    <PropertyCard property={scored.property} />

                    {/* Reasons + warnings */}
                    {(scored.reasons.length > 0 || scored.warnings.length > 0) && (
                      <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                        {scored.reasons.map((r, i) => (
                          <p key={`r-${i}`} className="flex items-start gap-1.5 text-xs text-green-700">
                            <span className="mt-0.5">•</span>
                            <span>{r.text}</span>
                          </p>
                        ))}
                        {scored.warnings.map((w, i) => (
                          <p key={`w-${i}`} className="flex items-start gap-1.5 text-xs text-amber-700">
                            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                            <span>{w.text}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-2">
          <Link
            href="/?openModal=true"
            className="inline-block text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            Refine your preferences
          </Link>
          <span className="mx-2 text-gray-300">•</span>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            Browse all listings
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}