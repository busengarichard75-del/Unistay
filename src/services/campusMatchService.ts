// src/services/campusMatchService.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CampusMatchProfile } from "@/types/campusMatch";

const COLLECTION_NAME = "campusMatchProfiles";

export async function getMyCampusProfile(uid: string): Promise<CampusMatchProfile | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CampusMatchProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching campus profile:", error);
    return null;
  }
}

export async function saveCampusProfile(
  uid: string, 
  data: Omit<CampusMatchProfile, "uid" | "createdAt" | "updatedAt">
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const existing = await getDoc(docRef);
    
    // Build the payload
    const payload: any = {
      ...data,
      uid,
      updatedAt: Date.now(),
      createdAt: existing.exists() ? existing.data().createdAt : Date.now(),
    };

    // ⭐ FIX: Firestore does not accept `undefined` values.
    // We loop through and delete any fields that are undefined or empty strings.
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    await setDoc(docRef, payload);
  } catch (error) {
    console.error("Error saving campus profile:", error);
    throw error;
  }
}

export async function deleteCampusProfile(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, uid));
  } catch (error) {
    console.error("Error deleting campus profile:", error);
    throw error;
  }
}

export async function getCampusMatches(myProfile: CampusMatchProfile): Promise<CampusMatchProfile[]> {
  try {
    // 1. Fetch profiles of the same gender (all universities)
    const q = query(
      collection(db, COLLECTION_NAME),
      where("gender", "==", myProfile.gender)
    );

    const snapshot = await getDocs(q);
    const allProfiles = snapshot.docs.map((d) => d.data() as CampusMatchProfile);

    // 2. Filter out myself and anyone who doesn't want what I'm looking for
    const compatibleProfiles = allProfiles.filter((p) => {
      if (p.uid === myProfile.uid) return false;

      const myWant = myProfile.lookingFor;
      const theirWant = p.lookingFor;

      if (myWant === "Both" || theirWant === "Both") return true;
      return myWant === theirWant;
    });

    // 3. Score the matches (higher score = better match)
    const scored = compatibleProfiles.map((p) => {
      let score = 0;
      
      // HUGE bonus if they are at the same university
      if (p.university === myProfile.university) score += 10; 
      
      if (p.sleepSchedule === myProfile.sleepSchedule) score += 2;
      if (p.cleanliness === myProfile.cleanliness) score += 2;
      if (p.noiseTolerance === myProfile.noiseTolerance) score += 2;
      if (p.studyMode === myProfile.studyMode) score += 1;
      if (p.yearOfStudy === myProfile.yearOfStudy) score += 1;
      if (p.course && p.course === myProfile.course) score += 3;

      return { profile: p, score };
    });

    // 4. Sort by highest score, then by newest
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.profile.createdAt - a.profile.createdAt;
    });

    // 5. Return the top 50 matches
    return scored.slice(0, 50).map((s) => s.profile);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}