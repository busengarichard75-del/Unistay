// src/services/appointmentService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Appointment } from "@/types/appointment";

const apptsRef = collection(db, "appointments");

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "status">
): Promise<string> {
  try {
    const docRef = await addDoc(apptsRef, {
      ...data,
      status: "pending",
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Failed to create appointment:", error);
    throw error;
  }
}

export async function getProviderAppointments(providerId: string): Promise<Appointment[]> {
  try {
    const q = query(
      apptsRef,
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
  } catch (error) {
    console.error("Failed to fetch provider appointments:", error);
    return [];
  }
}

export async function getStudentAppointments(studentId: string): Promise<Appointment[]> {
  try {
    const q = query(
      apptsRef,
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
  } catch (error) {
    console.error("Failed to fetch student appointments:", error);
    return [];
  }
}

// ⭐ NEW: Fetch all appointments (For Admin)
export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    const q = query(apptsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
  } catch (error) {
    console.error("Failed to fetch all appointments:", error);
    return [];
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: "confirmed" | "cancelled" | "completed"
): Promise<void> {
  try {
    await updateDoc(doc(db, "appointments", id), { status });
  } catch (error) {
    console.error("Failed to update appointment status:", error);
    throw error;
  }
}