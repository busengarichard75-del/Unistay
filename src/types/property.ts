export interface BedSpace {
  id: string;
  isAvailable: boolean;
  type?: "Top" | "Bottom";
}

export interface Room {
  id: string;
  name: string;              // e.g., "Room 1"
  bedCount: number;          // for UI convenience (not stored explicitly in Firestore – computed from bedSpaces.length)
  bedSpaces: BedSpace[];
}

export type PaymentPeriod = "monthly" | "termly";
export type GenderPreference = "male" | "female" | "mixed";
export type DistanceBucket = "under5" | "5to15" | "15to30" | "over30";

export interface Amenities {
  electricity: boolean;
  water: boolean;
  security: boolean;
}

export type VerificationStatus = "pending" | "approved" | "rejected";

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
  bedSpaces?: BedSpace[];
  rooms?: Room[];
  latitude?: number;
  longitude?: number;
  isBoosted?: boolean;
  boostedAt?: number;
  boostExpiry?: number;
  additionalAmenities?: string[];
  verificationStatus?: VerificationStatus;
  
  // ✅ NEW – Landlord Experience Upgrade
  isActive?: boolean;        // default: true – if false, hidden from public
  views?: number;            // view counter
  bookings?: number;         // confirmed bookings count
}