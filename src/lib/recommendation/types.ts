/**
 * Student preferences for accommodation recommendation.
 * This is the input to the recommendation engine.
 */
export interface Preferences {
  /** Maximum monthly budget in K (ZMW) */
  budgetMax: number;

  /** University ID (optional – if not specified, no university filter) */
  universityId?: string;

  /** Maximum walking time in minutes (optional – uses distanceBucket if not specified) */
  maxWalkingMinutes?: number;

  /** Gender preference – uses the property's genderPreference field */
  genderPreference?: "male" | "female" | "mixed";

  /** Priority weights for different factors (0-1, sum should be 1) */
  priorities: PriorityWeights;

  /** Specific amenities required (e.g., ["wifi", "security"]) */
  requiredAmenities?: string[];
}

/**
 * Priority weights determine how much each factor influences the match score.
 * All weights should be between 0 and 1, and sum to 1 (normalised).
 */
export interface PriorityWeights {
  budget: number;      // 0-1, higher means budget matters more
  distance: number;    // 0-1, higher means distance matters more
  amenities: number;   // 0-1, higher means amenities matter more
  availability: number;// 0-1, higher means availability matters more
  security: number;    // 0-1, higher means security matters more
  // Optional future: gender, reviews, etc.
}

/**
 * The result of scoring a single property against preferences.
 */
export interface ScoredProperty {
  property: Property;
  score: number;          // overall match score (0-100)
  budgetScore: number;
  distanceScore: number;
  amenitiesScore: number;
  availabilityScore: number;
  securityScore: number;
  matchReasons: string[]; // human-readable explanations
}