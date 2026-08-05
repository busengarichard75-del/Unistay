import { Property } from "@/types/property";

export const properties: Property[] = [
  {
    id: "1",
    ownerId: "sample-owner",
    title: "Cozy Studio Near Mukuba University",
    price: 1500,
    paymentPeriod: "monthly",
    location: "Riverside, Kitwe",
    imageUrl: "https://picsum.photos/seed/unistay1/600/400",
    bedSpaces: [
      { id: "1-a", isAvailable: true },
      { id: "1-b", isAvailable: false },
      { id: "1-c", isAvailable: true },
    ],
  },
  {
    id: "2",
    ownerId: "sample-owner",
    title: "Shared Boarding House, 5 Min Walk to Campus",
    price: 900,
    paymentPeriod: "monthly",
    location: "Parklands, Kitwe",
    imageUrl: "https://picsum.photos/seed/unistay2/600/400",
    bedSpaces: [
      { id: "2-a", isAvailable: true },
      { id: "2-b", isAvailable: true },
      { id: "2-c", isAvailable: true },
      { id: "2-d", isAvailable: false },
    ],
  },
  {
    id: "3",
    ownerId: "sample-owner",
    title: "Modern Apartment with Backup Power",
    price: 2200,
    paymentPeriod: "termly",
    location: "Nkana East, Kitwe",
    imageUrl: "https://picsum.photos/seed/unistay3/600/400",
    bedSpaces: [
      { id: "3-a", isAvailable: false },
      { id: "3-b", isAvailable: false },
    ],
  },
];