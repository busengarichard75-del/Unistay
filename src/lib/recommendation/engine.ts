import { Property } from "@/types/property";
import { Preferences, ScoredProperty, PriorityWeights } from "./types";
import { isBoosted } from "@/lib/boostService";

/**
 * Calculate the distance score based on distanceBucket and user's maxWalkingMinutes.
 * If no maxWalkingMinutes, all properties get a neutral score (0.5).
 */
function calculateDistanceScore(property: Property, preferences: Preferences): number {
  const { maxWalkingMinutes } = preferences;
  if (!maxWalkingMinutes) return 0.5; // neutral

  // Map distanceBucket to approximate minutes
  const distanceMap: Record<string, number> = {
    under5: 5,
    "5to15": 10,
    "15to30": 20,
    over30: 35,
  };
  const propertyMinutes = distanceMap[property.distanceBucket] || 20;

  // Score: 1.0 if within max, decreasing linearly beyond
  if (propertyMinutes <= maxWalkingMinutes) return 1.0;
  const excess = propertyMinutes - maxWalkingMinutes;
  return Math.max(0, 1 - excess / 30); // penalty up to 30 min over
}

/**
 * Calculate budget score based on price and budgetMax.
 */
function calculateBudgetScore(property: Property, preferences: Preferences): number {
  const { budgetMax } = preferences;
  if (budgetMax <= 0) return 0;
  if (property.price <= budgetMax) return 1.0;
  // Penalise linearly above budget (10% over budget gives 0.9, 50% over gives 0.5)
  const ratio = property.price / budgetMax;
  return Math.max(0, 1 - (ratio - 1) * 2); // penalise twice the excess
}

/**
 * Calculate amenities score: count of matched amenities (electricity, water, security, additional).
 */
function calculateAmenitiesScore(property: Property, preferences: Preferences): number {
  const { requiredAmenities = [] } = preferences;
  if (requiredAmenities.length === 0) return 1.0; // no requirements = perfect

  let matched = 0;
  const amenities = property.amenities || {};
  const additional = property.additionalAmenities || [];

  requiredAmenities.forEach((req) => {
    const lower = req.toLowerCase();
    // Check standard amenities
    if (lower === "electricity" && amenities.electricity) matched++;
    else if (lower === "water" && amenities.water) matched++;
    else if (lower === "security" && amenities.security) matched++;
    // Check additional amenities (case-insensitive)
    else if (additional.some((a) => a.toLowerCase().includes(lower))) matched++;
  });

  return matched / requiredAmenities.length;
}

/**
 * Calculate availability score: proportion of available beds.
 */
function calculateAvailabilityScore(property: Property): number {
  const bedSpaces = property.bedSpaces || [];
  if (bedSpaces.length === 0) return 0;
  const available = bedSpaces.filter((bed) => bed.isAvailable).length;
  return available / bedSpaces.length;
}

/**
 * Calculate security score: whether security amenity is present.
 */
function calculateSecurityScore(property: Property): number {
  return property.amenities?.security ? 1.0 : 0.0;
}

/**
 * Normalise weights so they sum to 1.
 */
function normaliseWeights(weights: PriorityWeights): PriorityWeights {
  const total = weights.budget + weights.distance + weights.amenities + weights.availability + weights.security;
  if (total === 0) return { budget: 0.2, distance: 0.2, amenities: 0.2, availability: 0.2, security: 0.2 };
  return {
    budget: weights.budget / total,
    distance: weights.distance / total,
    amenities: weights.amenities / total,
    availability: weights.availability / total,
    security: weights.security / total,
  };
}

/**
 * Main recommendation engine.
 */
export function recommendProperties(
  properties: Property[],
  preferences: Preferences
): ScoredProperty[] {
  const { budgetMax, universityId, genderPreference } = preferences;

  // Step 1: Hard filters
  let filtered = properties.filter((p) => {
    // Budget: must be <= budgetMax (if budgetMax is set)
    if (budgetMax > 0 && p.price > budgetMax) return false;

    // University filter
    if (universityId && p.universityId !== universityId) return false;

    // Gender preference
    if (genderPreference && genderPreference !== "mixed") {
      if (p.genderPreference !== genderPreference && p.genderPreference !== "mixed") return false;
    }

    // Must have at least one available bed
    const bedSpaces = p.bedSpaces || [];
    if (!bedSpaces.some((bed) => bed.isAvailable)) return false;

    return true;
  });

  if (filtered.length === 0) return [];

  // Step 2: Compute scores
  const normalisedWeights = normaliseWeights(preferences.priorities);

  const scored = filtered.map((property) => {
    const budgetScore = calculateBudgetScore(property, preferences);
    const distanceScore = calculateDistanceScore(property, preferences);
    const amenitiesScore = calculateAmenitiesScore(property, preferences);
    const availabilityScore = calculateAvailabilityScore(property);
    const securityScore = calculateSecurityScore(property);

    const overall =
      normalisedWeights.budget * budgetScore +
      normalisedWeights.distance * distanceScore +
      normalisedWeights.amenities * amenitiesScore +
      normalisedWeights.availability * availabilityScore +
      normalisedWeights.security * securityScore;

    // Convert to percentage (0-100)
    const score = Math.round(overall * 100);

    // Generate reasons
    const reasons: string[] = [];
    if (budgetScore >= 0.9) reasons.push("Fits your budget perfectly.");
    else if (budgetScore > 0.5) reasons.push("Within your budget range.");
    else reasons.push("Slightly above your ideal budget.");

    if (distanceScore >= 0.9) reasons.push("Very close to campus.");
    else if (distanceScore > 0.5) reasons.push("Reasonable walking distance.");
    else reasons.push("Farther from campus, but still accessible.");

    if (amenitiesScore >= 0.8) reasons.push("Matches your desired amenities.");
    else if (amenitiesScore > 0.5) reasons.push("Has some of the amenities you want.");
    else reasons.push("Limited amenities matching your preferences.");

    if (availabilityScore >= 0.8) reasons.push("High availability of beds.");
    else reasons.push("Limited bed availability – book soon!");

    if (securityScore >= 0.9) reasons.push("Security features are present.");
    else reasons.push("Security information is not confirmed.");

    return {
      property,
      score,
      budgetScore,
      distanceScore,
      amenitiesScore,
      availabilityScore,
      securityScore,
      matchReasons: reasons,
    };
  });

  // Step 3: Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Step 4: Boosted properties get a small bonus? We'll keep it simple – no boost influence.

  return scored;
}