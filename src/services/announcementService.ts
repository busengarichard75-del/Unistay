import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ANNOUNCEMENT_DOC_ID = "main";

export interface Announcement {
  content: string;
  isActive: boolean;
  updatedAt: number;
}

export async function getAnnouncement(): Promise<Announcement | null> {
  try {
    const docRef = doc(db, "announcements", ANNOUNCEMENT_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Announcement;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateAnnouncement(data: Partial<Announcement>): Promise<void> {
  const docRef = doc(db, "announcements", ANNOUNCEMENT_DOC_ID);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}