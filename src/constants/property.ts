import { DistanceBucket } from "@/types/property";

export const DISTANCE_LABELS: Record<DistanceBucket, string> = {
  under5: "Under 5 min walk",
  "5to15": "5–15 min walk",
  "15to30": "15–30 min walk",
  over30: "30+ min / need transport",
};