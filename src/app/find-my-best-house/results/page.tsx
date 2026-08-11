"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getAllProperties } from "@/services/propertyService";
import { recommendProperties } from "@/lib/recommendation/engine";
import { Preferences, ScoredProperty } from "@/lib/recommendation/types";
import { PropertyCard } from "@/components/property/PropertyCard";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scoredProperties, setScoredProperties] = useState<ScoredProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
        <div className="container-medium text-center">
          <p className="text-gray-500">Finding your best matches...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
        <div className="container-medium text-center">
          <p className="text-red-500">{error}</p>
          <Link href="/" className="text-[var(--nexora-primary)] hover:underline">
            Go back and try again
          </Link>
        </div>
      </main>
    );
  }

  if (scoredProperties.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
        <div className="container-medium text-center">
          <p className="text-gray-500">We couldn't find any properties matching your preferences.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your budget, distance, or priorities.</p>
          <Link href="/?openModal=true" className="mt-4 inline-block text-[var(--nexora-primary)] hover:underline">
            Adjust preferences
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-10">
      <div className="container-medium">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">🧭 Your Best Matches</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6">
          <p className="text-sm text-gray-500">
            Showing {scoredProperties.length} properties based on your preferences.
            {preferences?.budgetMax && ` Budget: K${preferences.budgetMax}`}
            {preferences?.universityId && ` • University selected`}
          </p>
        </div>

        <div className="space-y-6">
          {scoredProperties.map((scored, index) => {
            let rankBadge = "";
            let rankBg = "";
            if (index === 0) { rankBadge = "🥇"; rankBg = "bg-yellow-100 text-yellow-800"; }
            else if (index === 1) { rankBadge = "🥈"; rankBg = "bg-gray-100 text-gray-700"; }
            else if (index === 2) { rankBadge = "🥉"; rankBg = "bg-amber-100 text-amber-800"; }
            else { rankBadge = `${index + 1}`; rankBg = "bg-gray-50 text-gray-500"; }

            return (
              <div key={scored.property.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${rankBg}`}>
                        {rankBadge}
                      </span>
                      <span className="text-sm font-medium text-gray-500">Match Score</span>
                      <span className="text-2xl font-bold text-[var(--nexora-primary)]">{scored.score}%</span>
                    </div>
                    <Link href={`/property/${scored.property.id}`} className="text-xs text-[var(--nexora-primary)] hover:underline">
                      View Property →
                    </Link>
                  </div>

                  <PropertyCard property={scored.property} />

                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-700">Why we recommend this:</p>
                    <ul className="mt-1 list-disc list-inside text-xs text-gray-500 space-y-0.5">
                      {scored.matchReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/?openModal=true" className="text-sm text-[var(--nexora-primary)] hover:underline">
            Refine your preferences
          </Link>
          <span className="mx-2 text-gray-300">•</span>
          <Link href="/" className="text-sm text-[var(--nexora-primary)] hover:underline">
            Browse all listings
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--nexora-surface)] flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <ResultsContent />
    </Suspense>
  );
}