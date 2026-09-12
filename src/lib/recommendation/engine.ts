// src/lib/recommendation/engine.ts
import { Property } from "@/types/property";
import { isBoosted } from "@/lib/boostService";
import {
  Preferences,
  ScoredProperty,
  MustHaveKey,
  ComfortKey,
  MatchReason,
  MatchWarning,
} from "./types";

// ─── Keyword dictionaries for amenity matching ─────────────────
const MUST_HAVE_KEYWORDS: Record<MustHaveKey, string[]> = {
  private_bathroom: [
    "private bathroom",
    "private bath",
    "private toilet",
    "en-suite",
    "ensuite",
    "own bathroom",
  ],
  backup_power: [
    "backup power",
    "backup generator",
    "generator",
    "inverter",
  ],
  borehole_water: [
    "borehole",
    "water tank",
    "reliable water",
    "constant water",
  ],
  wifi: ["wifi", "wi-fi", "internet", "fiber", "fibre"],
  gated_compound: [
    "gated",
    "secure compound",
    "gated community",
    "security gate",
  ],
  female_only: ["female only", "girls only", "ladies only", "female"],
  male_only: ["male only", "boys only", "gents only", "male"],
};

const COMFORT_KEYWORDS: Record<ComfortKey, string[]> = {
  study_desk: ["study desk", "study table", "desk"],
  wardrobe: ["wardrobe", "closet", "cupboard"],
  ceiling_fan: ["fan", "ceiling fan"],
  hot_water: ["hot water", "geyser", "hot shower"],
  tiled_floors: ["tiled", "tiles", "tiled floor"],
  shared_kitchen: ["kitchen", "shared kitchen", "common kitchen"],
  cctv: ["cctv", "camera", "security camera"],
  solar: ["solar", "solar panel", "solar power"],
};

const QUIET_KEYWORDS = ["quiet", "peaceful", "study-friendly", "calm"];
const SOCIAL_KEYWORDS = ["social", "friendly", "community", "lively"];

// ─── Distance helper ───────────────────────────────────────────
const DISTANCE_BUCKET_MINUTES: Record<string, number> = {
  under5: 5,
  "5to15": 10,
  "15to30": 20,
  over30: 35,
};

// ─── Helpers ───────────────────────────────────────────────────
function amenitiesText(property: Property): string {
  const additional = property.additionalAmenities || [];
  const extra = [
    property.amenities?.electricity ? "electricity" : "",
    property.amenities?.water ? "water" : "",
    property.amenities?.security ? "security" : "",
  ].filter(Boolean);
  return [...additional, ...extra].join(" ").toLowerCase();
}

function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k.toLowerCase()));
}

function getRoomTypeMatch(property: Property, preference: string): "match" | "partial" | "none" {
  if (preference === "any") return "match";

  const bedSpaces = property.bedSpaces || [];
  const rooms = property.rooms || [];

  // Check bed-space level for bunks
  if (preference === "top_bunk") {
    return bedSpaces.some((b) => b.type === "Top") ? "match" : "none";
  }
  if (preference === "bottom_bunk") {
    return bedSpaces.some((b) => b.type === "Bottom") ? "match" : "none";
  }
  if (preference === "single") {
    // A "single" room = a room with exactly 1 bed OR any single-type bed
    const hasSingleRoom = rooms.some((r) => r.bedSpaces.length === 1);
    return hasSingleRoom ? "match" : "none";
  }
  return "none";
}

// ─── Scoring components ────────────────────────────────────────

function scoreBudget(property: Property, prefs: Preferences): { score: number; answered: boolean } {
  if (!prefs.budgetMax || prefs.budgetMax <= 0) return { score: 0, answered: false };
  if (property.price <= prefs.budgetMax) return { score: 1, answered: true };

  // Over-budget: penalize linearly (25% over = 0.5)
  const ratio = property.price / prefs.budgetMax;
  const score = Math.max(0, 1 - (ratio - 1) * 2);
  return { score, answered: true };
}

function scoreDistance(property: Property, prefs: Preferences): { score: number; answered: boolean } {
  if (!prefs.maxWalkingMinutes) return { score: 0, answered: false };

  const propertyMinutes = DISTANCE_BUCKET_MINUTES[property.distanceBucket] ?? 20;

  if (propertyMinutes <= prefs.maxWalkingMinutes) return { score: 1, answered: true };

  const excess = propertyMinutes - prefs.maxWalkingMinutes;
  const score = Math.max(0, 1 - excess / 30);
  return { score, answered: true };
}

function scoreRoomType(property: Property, prefs: Preferences): { score: number; answered: boolean } {
  if (!prefs.roomType || prefs.roomType === "any") return { score: 0, answered: false };
  const match = getRoomTypeMatch(property, prefs.roomType);
  return { score: match === "match" ? 1 : 0, answered: true };
}

function scoreMustHaves(
  property: Property,
  prefs: Preferences
): {
  score: number;
  answered: boolean;
  missing: MustHaveKey[];
  hasDisqualifier: boolean;
} {
  const mustHaves = prefs.mustHaves || [];
  const genderPref = prefs.genderPreference && prefs.genderPreference !== "mixed" ? prefs.genderPreference : null;

  if (mustHaves.length === 0 && !genderPref) {
    return { score: 0, answered: false, missing: [], hasDisqualifier: false };
  }

  const text = amenitiesText(property);
  const missing: MustHaveKey[] = [];
  let matched = 0;
  let total = 0;

  // Gender must-haves
  if (mustHaves.includes("female_only")) {
    total++;
    if (property.genderPreference === "female" || property.genderPreference === "mixed") matched++;
    else missing.push("female_only");
  }
  if (mustHaves.includes("male_only")) {
    total++;
    if (property.genderPreference === "male" || property.genderPreference === "mixed") matched++;
    else missing.push("male_only");
  }

  // Amenity must-haves
  const amenityKeys: MustHaveKey[] = [
    "private_bathroom",
    "backup_power",
    "borehole_water",
    "wifi",
    "gated_compound",
  ];

  amenityKeys.forEach((key) => {
    if (mustHaves.includes(key)) {
      total++;
      if (matchesAnyKeyword(text, MUST_HAVE_KEYWORDS[key])) matched++;
      else missing.push(key);
    }
  });

  const score = total > 0 ? matched / total : 0;
  // Disqualify if more than half of must-haves missing
  const hasDisqualifier = total > 0 && missing.length / total > 0.5;

  return { score, answered: true, missing, hasDisqualifier };
}

function scoreComforts(
  property: Property,
  prefs: Preferences
): { score: number; answered: boolean; matched: ComfortKey[] } {
  const comforts = prefs.comforts || [];
  if (comforts.length === 0) return { score: 0, answered: false, matched: [] };

  const text = amenitiesText(property);
  const matched = comforts.filter((key) => matchesAnyKeyword(text, COMFORT_KEYWORDS[key]));
  return { score: matched.length / comforts.length, answered: true, matched };
}

function scoreVibe(
  property: Property,
  prefs: Preferences
): { score: number; answered: boolean } {
  if (!prefs.vibe || prefs.vibe === "any") return { score: 0, answered: false };

  const text = amenitiesText(property);
  const keywords = prefs.vibe === "quiet" ? QUIET_KEYWORDS : SOCIAL_KEYWORDS;
  return { score: matchesAnyKeyword(text, keywords) ? 1 : 0.5, answered: true };
}

// ─── Weight distribution ───────────────────────────────────────

function buildWeights(answered: {
  budget: boolean;
  distance: boolean;
  roomType: boolean;
  mustHaves: boolean;
  comforts: boolean;
  vibe: boolean;
}) {
  // Base ideal weights (when everything is answered)
  const ideal = {
    budget: 0.20,
    distance: 0.10,
    roomType: 0.05,
    mustHaves: 0.35,
    comforts: 0.20,
    vibe: 0.10,
  };

  // Zero out unanswered
  const raw = {
    budget: answered.budget ? ideal.budget : 0,
    distance: answered.distance ? ideal.distance : 0,
    roomType: answered.roomType ? ideal.roomType : 0,
    mustHaves: answered.mustHaves ? ideal.mustHaves : 0,
    comforts: answered.comforts ? ideal.comforts : 0,
    vibe: answered.vibe ? ideal.vibe : 0,
  };

  const total = raw.budget + raw.distance + raw.roomType + raw.mustHaves + raw.comforts + raw.vibe;
  if (total === 0) {
    // Nothing answered — return neutral weights for availability only
    return { ...raw, availability: 1 };
  }

  return {
    budget: raw.budget / total,
    distance: raw.distance / total,
    roomType: raw.roomType / total,
    mustHaves: raw.mustHaves / total,
    comforts: raw.comforts / total,
    vibe: raw.vibe / total,
    availability: 0,
  };
}

// ─── Reason generation ─────────────────────────────────────────

function buildReasons(
  property: Property,
  prefs: Preferences,
  components: {
    budget: { score: number; answered: boolean };
    distance: { score: number; answered: boolean };
    roomType: { score: number; answered: boolean };
    mustHaves: { score: number; answered: boolean; missing: MustHaveKey[] };
    comforts: { score: number; answered: boolean; matched: ComfortKey[] };
    vibe: { score: number; answered: boolean };
  }
): { reasons: MatchReason[]; warnings: MatchWarning[] } {
  const reasons: MatchReason[] = [];
  const warnings: MatchWarning[] = [];

  if (components.budget.answered) {
    if (components.budget.score >= 0.95) reasons.push({ text: "Within your budget ✅" });
    else if (components.budget.score >= 0.6) warnings.push({ text: `K${property.price.toLocaleString()} is slightly above your budget` });
    else warnings.push({ text: `K${property.price.toLocaleString()} is above your budget` });
  }

  if (components.distance.answered) {
    const minutes = DISTANCE_BUCKET_MINUTES[property.distanceBucket] ?? 20;
    if (components.distance.score >= 0.95) reasons.push({ text: `Only ~${minutes} min walk to campus ✅` });
    else warnings.push({ text: `~${minutes} min walk — more than you wanted` });
  }

  if (components.roomType.answered && components.roomType.score >= 0.95) {
    reasons.push({ text: "Room type matches your preference ✅" });
  }

  if (components.mustHaves.answered) {
    const missing = components.missing;
    if (missing.length === 0) {
      reasons.push({ text: "All your must-haves are available ✅" });
    } else {
      missing.forEach((key) => {
        const label = MUST_HAVE_LABELS[key];
        warnings.push({ text: `No ${label} listed` });
      });
    }
  }

  if (components.comforts.answered && components.comforts.matched.length > 0) {
    const names = components.comforts.matched.map((k) => COMFORT_LABELS[k]);
    reasons.push({ text: `Has ${names.slice(0, 3).join(", ")} ✅` });
  }

  if (components.vibe.answered && components.vibe.score >= 0.9) {
    reasons.push({ text: `Matches your ${prefs.vibe} vibe ✅` });
  }

  // Always mention a verified badge
  if (property.verificationStatus === "approved") {
    reasons.push({ text: "Peza Verified ✅" });
  }

  return { reasons, warnings };
}

// ─── Display labels ────────────────────────────────────────────
export const MUST_HAVE_LABELS: Record<MustHaveKey, string> = {
  private_bathroom: "private bathroom",
  backup_power: "backup power",
  borehole_water: "borehole water",
  wifi: "WiFi",
  gated_compound: "gated compound",
  female_only: "female-only compound",
  male_only: "male-only compound",
};

export const COMFORT_LABELS: Record<ComfortKey, string> = {
  study_desk: "study desk",
  wardrobe: "wardrobe",
  ceiling_fan: "ceiling fan",
  hot_water: "hot water",
  tiled_floors: "tiled floors",
  shared_kitchen: "shared kitchen",
  cctv: "CCTV",
  solar: "solar power",
};

// ─── Main engine ───────────────────────────────────────────────
export function recommendProperties(
  properties: Property[],
  prefs: Preferences
): ScoredProperty[] {
  // 1. Hard filters (only for something essential)
  let filtered = properties.filter((p) => {
    if (p.isActive === false) return false;

    // Budget — only hard filter if a budget was set
    if (prefs.budgetMax && prefs.budgetMax > 0 && p.price > prefs.budgetMax * 1.5) {
      return false;
    }

    // University — hard filter if specified
    if (prefs.universityId && p.universityId !== prefs.universityId) return false;

    // Gender — hard filter
    if (prefs.genderPreference && prefs.genderPreference !== "mixed") {
      if (p.genderPreference !== prefs.genderPreference && p.genderPreference !== "mixed") {
        return false;
      }
    }

    // Must have at least 1 available bed
    const bedSpaces = p.bedSpaces || [];
    if (!bedSpaces.some((b) => b.isAvailable)) return false;

    // Must-have disqualifiers
    const mh = scoreMustHaves(p, prefs);
    if (mh.hasDisqualifier) return false;

    return true;
  });

  if (filtered.length === 0) return [];

  // 2. Score each
  const scored: ScoredProperty[] = filtered.map((property) => {
    const budget = scoreBudget(property, prefs);
    const distance = scoreDistance(property, prefs);
    const roomType = scoreRoomType(property, prefs);
    const mustHaves = scoreMustHaves(property, prefs);
    const comforts = scoreComforts(property, prefs);
    const vibe = scoreVibe(property, prefs);

    const weights = buildWeights({
      budget: budget.answered,
      distance: distance.answered,
      roomType: roomType.answered,
      mustHaves: mustHaves.answered,
      comforts: comforts.answered,
      vibe: vibe.answered,
    });

    // Compute weighted score
    let overall =
      weights.budget * budget.score +
      weights.distance * distance.score +
      weights.roomType * roomType.score +
      weights.mustHaves * mustHaves.score +
      weights.comforts * comforts.score +
      weights.vibe * vibe.score;

    // Fallback when nothing is answered — show available properties ranked by availability
    if (
      !budget.answered &&
      !distance.answered &&
      !roomType.answered &&
      !mustHaves.answered &&
      !comforts.answered &&
      !vibe.answered
    ) {
      const beds = property.bedSpaces || [];
      const ratio = beds.length > 0 ? beds.filter((b) => b.isAvailable).length / beds.length : 0;
      overall = 0.5 + ratio * 0.5;
    }

    // Small boost for boosted properties (max +3)
    const boostBonus = isBoosted(property) ? 0.03 : 0;
    overall = Math.min(1, overall + boostBonus);

    const score = Math.round(overall * 100);

    const { reasons, warnings } = buildReasons(property, prefs, {
      budget,
      distance,
      roomType,
      mustHaves,
      comforts,
      vibe,
    });

    return {
      property,
      score,
      reasons,
      warnings,
      breakdown: {
        budget: budget.answered ? Math.round(budget.score * 100) : undefined,
        distance: distance.answered ? Math.round(distance.score * 100) : undefined,
        roomType: roomType.answered ? Math.round(roomType.score * 100) : undefined,
        mustHaves: mustHaves.answered ? Math.round(mustHaves.score * 100) : undefined,
        comforts: comforts.answered ? Math.round(comforts.score * 100) : undefined,
        vibe: vibe.answered ? Math.round(vibe.score * 100) : undefined,
      },
    };
  });

  // 3. Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  return scored;
}