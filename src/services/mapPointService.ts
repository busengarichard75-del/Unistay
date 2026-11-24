// src/services/mapPointService.ts
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { MapPoint, MapPointCategory } from "@/types/mapPoint";

const COLLECTION = "mapPoints";

export async function addMapPoint(data: Omit<MapPoint, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), data);
  return docRef.id;
}

export async function getMapPoints(): Promise<MapPoint[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MapPoint));
}

export async function deleteMapPoint(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function updateMapPoint(id: string, data: Partial<MapPoint>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}