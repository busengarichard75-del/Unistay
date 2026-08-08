export interface BedSpace {
  id: string;
  isAvailable: boolean;
  type?: "Top" | "Bottom";
}

export type PaymentPeriod = "monthly" | "termly";
export type GenderPreference = "male" | "female" | "mixed";
export type DistanceBucket = "under5" | "5to15" | "15to30" | "over30";

export interface Amenities {
  electricity: boolean;
  water: boolean;
  security: boolean;
}

export interface Property {
  id: string;
  ownerId: string;
  universityId: string;
  title: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  genderPreference: GenderPreference;
  distanceBucket: DistanceBucket;
  amenities: Amenities;
  location: string;
  imageUrl?: string;
  imageUrls?: string[];
  bedSpaces: BedSpace[];
  // ✅ NEW: Map coordinates (optional, for backward compatibility)
  latitude?: number;
  longitude?: number;
}