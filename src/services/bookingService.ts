// src/services/bookingService.ts
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
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking, BookingStatus } from "@/types/booking";
import { isBookingExpired } from "@/lib/bookingExpiration";

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

export async function updateBookingStatus(
  id: string,
  data: Partial<Pick<Booking, "status" | "confirmationId" | "confirmationCode" | "verificationToken" | "approvedAt" | "confirmedAt" | "approvalExpiresAt" | "expiredAt">>
): Promise<void> {
  try {
    await updateDoc(doc(db, "bookings", id), data);
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

// ─── CONFIRM BOOKING WITH ATOMIC TRANSACTION ───
export async function confirmBooking(
  bookingId: string,
  propertyId: string,
  bedSpaceId: string
): Promise<void> {
  const bookingRef = doc(db, "bookings", bookingId);
  const propertyRef = doc(db, "properties", propertyId);

  await runTransaction(db, async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef);
    const propertySnap = await transaction.get(propertyRef);

    if (!bookingSnap.exists()) {
      throw new Error("Booking not found");
    }
    if (!propertySnap.exists()) {
      throw new Error("Property not found");
    }

    const booking = bookingSnap.data() as Booking;
    const property = propertySnap.data() as any;

    // Validate booking status
    if (booking.status !== "approved") {
      throw new Error("Booking must be approved to confirm");
    }

    // Check expiration
    if (booking.approvalExpiresAt && Date.now() > booking.approvalExpiresAt) {
      throw new Error("Booking has expired");
    }

    // Find the bed space
    const bedSpaces = property.bedSpaces || [];
    const bedIndex = bedSpaces.findIndex((b: any) => b.id === bedSpaceId);
    if (bedIndex === -1) {
      throw new Error("Bed space not found");
    }
    if (!bedSpaces[bedIndex].isAvailable) {
      throw new Error("Bed is no longer available");
    }

    // Mark bed as unavailable
    bedSpaces[bedIndex].isAvailable = false;

    // Update property
    transaction.update(propertyRef, { bedSpaces });

    // Update booking
    transaction.update(bookingRef, {
      status: "confirmed",
      confirmedAt: Date.now(),
    });
  });
}

// ─── EXPIRE EXPIRED BOOKINGS ───
export async function expireExpiredBookings(userId: string): Promise<number> {
  try {
    const q = query(
      bookingsRef,
      where("studentId", "==", userId),
      where("status", "==", "approved")
    );
    const snapshot = await getDocs(q);
    let expiredCount = 0;

    for (const docRef of snapshot.docs) {
      const booking = { id: docRef.id, ...docRef.data() } as Booking;
      if (isBookingExpired(booking)) {
        // Also need to free the bed space (optional – can be done in separate transaction)
        await updateDoc(docRef.ref, {
          status: "expired",
          expiredAt: Date.now(),
        });
        expiredCount++;
      }
    }
    return expiredCount;
  } catch (error) {
    console.error("Failed to expire bookings:", error);
    throw error;
  }
}