// src/lib/universityLabels.ts

import { universities } from "@/data/universities";

const SHORT_LABEL_CACHE = new Map<string, string>();

/**
 * Get a short, chip-friendly label for a university id.
 * "University of Zambia (UNZA)" → "UNZA"
 * "Mukuba University"           → "Mukuba"
 * Unknown id                    → returns the id itself
 */
export function getUniversityShortLabel(universityId: string): string {
  const cached = SHORT_LABEL_CACHE.get(universityId);
  if (cached) return cached;

  const uni = universities.find((u) => u.id === universityId);
  if (!uni) {
    SHORT_LABEL_CACHE.set(universityId, universityId);
    return universityId;
  }

  // Prefer the acronym in parentheses, e.g. "University of Zambia (UNZA)"
  const parenMatch = uni.name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const label = parenMatch[1];
    SHORT_LABEL_CACHE.set(universityId, label);
    return label;
  }

  // Otherwise strip trailing "University" / "College"
  const stripped = uni.name.replace(/\s*(University|College)\s*$/i, "").trim();
  const label = stripped || uni.name;
  SHORT_LABEL_CACHE.set(universityId, label);
  return label;
}

export function getUniversityFullName(universityId: string): string {
  const uni = universities.find((u) => u.id === universityId);
  return uni?.name || universityId;
}