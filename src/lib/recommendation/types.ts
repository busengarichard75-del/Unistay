// src/lib/recommendation/types.ts
import { Property } from "@/types/property";

// ─── Layer 2: Must-haves (deal-breakers) ───────────────────────
export type MustHaveKey =
  | "private_bathroom"
  | "backup_power"
  | "borehole_water"
  | "wifi"
  | "gated_compound"
  | "female_only"
  | "male_only";

// ─── Layer 3: Comfort needs (score boosters) ───────────────────
export type ComfortKey =
  | "study_desk"
  | "wardrobe"
  | "ceiling_fan"
  | "hot_water"
  | "tiled_floors"
  | "shared_kitchen"
  | "cctv"
  | "solar";

// ─── Layer 1: Essentials ───────────────────────────────────────
export type RoomTypePreference = "single" | "top_bunk" | "bottom_bunk" | "any";
export type PaymentPeriodPreference = "monthly" | "termly" | "semester" | "any";

// ─── Layer 4: Vibe ─────────────────────────────────────────────
export type VibePreference = "quiet" | "social" | "any";
export type RoommatePreference = "alone" | "ok_with_others" | "any";
export type MoveInTiming = "this_week" | "this_month" | "next_term" | "flexible";

// ─── Main Preferences object ───────────────────────────────────
export interface Preferences {
  // Layer 1 — Essentials (all optional)
  budgetMax?: number;
  paymentPeriod?: PaymentPeriodPreference;
  maxWalkingMinutes?: number;
  roomType?: RoomTypePreference;
  universityId?: string;

  // Layer 2 — Must-haves
  mustHaves?: MustHaveKey[];
  genderPreference?: "male" | "female" | "mixed";

  // Layer 3 — Comfort
  comforts?: ComfortKey[];

  // Layer 4 — Vibe
  vibe?: VibePreference;
  roommates?: RoommatePreference;
  moveInTiming?: MoveInTiming;

  // Meta — for the engine
  completedLayers?: 0 | 1 | 2 | 3 | 4;
}

// ─── Score reasons ─────────────────────────────────────────────
export interface MatchReason {
  text: string;
}

export interface MatchWarning {
  text: string;
}

// ─── Scored property ───────────────────────────────────────────
export interface ScoredProperty {
  property: Property;
  score: number; // 0-100
  reasons: MatchReason[];
  warnings: MatchWarning[];
  breakdown?: {
    budget?: number;
    distance?: number;
    roomType?: number;
    mustHaves?: number;
    comforts?: number;
    vibe?: number;
  };
}