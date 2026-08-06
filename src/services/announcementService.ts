import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ANNOUNCEMENT_DOC_ID = "main";

export interface Announcement {
  content: string;
  isActive: boolean;
  updatedAt: number;
}

export async function getAnnouncement(): Promise<Announcement | null> {
  if (!db) {
    return null;
  }

  try {
    const firestore = db;

    const docRef = doc(
      firestore,
      "announcements",
      ANNOUNCEMENT_DOC_ID
    );

    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as Announcement;
    }

    return null;
  } catch {
    return null;
  }
}

export async function updateAnnouncement(
  data: Partial<Announcement>
): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized");
  }

  const firestore = db;

  const docRef = doc(
    firestore,
    "announcements",
    ANNOUNCEMENT_DOC_ID
  );

  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}