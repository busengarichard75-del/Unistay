// src/types/campusMatch.ts

export type CampusMatchGender = "M" | "F";
export type CampusMatchLookingFor = "Roommate" | "Study partner" | "Partner" | "Both";
export type CampusMatchSleep = "Early bird" | "Night owl" | "Varies";
export type CampusMatchCleanliness = "Very clean" | "Moderate" | "Relaxed";
export type CampusMatchNoise = "Quiet" | "Some noise ok" | "Social";
export type CampusMatchStudyMode = "Solo" | "Group" | "Both";

export interface CampusMatchProfile {
  uid: string;
  firstName: string;
  gender: CampusMatchGender;
  university: string;
  yearOfStudy: string;
  lookingFor: CampusMatchLookingFor;
  sleepSchedule: CampusMatchSleep;
  cleanliness: CampusMatchCleanliness;
  noiseTolerance: CampusMatchNoise;
  studyMode: CampusMatchStudyMode;
  course: string;
  whatsapp: string;
  
  // New fields for the "Partner" pivot
  photoUrl?: string;
  bio?: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}