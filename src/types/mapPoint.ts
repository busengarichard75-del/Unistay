// src/types/mapPoint.ts
export type MapPointCategory = "gate" | "food" | "water" | "library" | "safety" | "landmark" | "service";

export interface MapPoint {
  id: string;
  name: string;
  category: MapPointCategory;
  description?: string;
  latitude: number;
  longitude: number;
  addedBy: string;
  createdAt: number;
}