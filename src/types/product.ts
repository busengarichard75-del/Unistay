// src/types/product.ts

export type ProductCondition = "new" | "like_new" | "used" | "for_parts";
export type ProductStatus = "available" | "sold";

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  condition: ProductCondition;
  imageUrls?: string[];
  location: string;
  universityId: string;
  latitude?: number;
  longitude?: number;
  whatsapp: string;
  status: ProductStatus;
  views: number;
  whatsappClicks: number;
  createdAt: number;
  updatedAt: number;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;
}

export const PRODUCT_CONDITIONS: { id: ProductCondition; label: string }[] = [
  { id: "new", label: "New" },
  { id: "like_new", label: "Like New" },
  { id: "used", label: "Used" },
  { id: "for_parts", label: "For Parts" },
];

export const PRODUCT_STATUSES: { id: ProductStatus; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "sold", label: "Sold" },
];