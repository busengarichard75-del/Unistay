import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking, BookingStatus } from "@/types/booking";

const bookingsRef = collection(db, "bookings");

export async function addBooking(data: Omit<Booking, "id">): Promise<string> {
  try {
    const docRef = await addDoc(bookingsRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add booking:", error);
    throw error;
  }
}

export async function getBookingsByStudent(studentId: string): Promise<Booking[]> {
  try {
    const q = query(
      bookingsRef,
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error("Failed to fetch student bookings:", error);
    return [];
  }
}

export async function getBookingsForLandlord(landlordId: string): Promise<Booking[]> {
  try {
    const q = query(
      bookingsRef,
      where("landlordId", "==", landlordId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error("Failed to fetch landlord bookings:", error);
    return [];
  }
}

export async function getAllApprovedBookings(): Promise<Booking[]> {
  try {
    const q = query(
      bookingsRef,
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error("Failed to fetch approved bookings:", error);
    return [];
  }
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  try {
    await updateDoc(doc(db, "bookings", id), { status });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    throw error;
  }
}

export async function deleteBooking(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "bookings", id));
  } catch (error) {
    console.error("Failed to delete booking:", error);
    throw error;
  }
}