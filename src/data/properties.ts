import { Property } from "@/types/property";

export const properties: Property[] = [
  {
    id: "1",
    ownerId: "sample-owner",
    universityId: "unza", // Add this
    title: "Cozy Studio Near Mukuba University",
    price: 1300,
    paymentPeriod: "monthly",
    genderPreference: "mixed", // Add this
    distanceBucket: "under5", // Add this
    amenities: { // Add this
      electricity: true,
      water: true,
      security: true,
    },
    location: "Mbachi",
    imageUrl: "https://picsum.photos/400/300",
    bedSpaces: [
      { id: "b1", isAvailable: true },
      { id: "b2", isAvailable: false },
    ],
  },
  // ... add more properties with all required fields
];