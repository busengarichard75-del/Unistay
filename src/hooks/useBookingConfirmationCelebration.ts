// src/hooks/useBookingConfirmationCelebration.ts
import { useState, useEffect } from "react";
import { useBookingListener } from "./useBookingListener";
import { Booking } from "@/types/booking"; // ✅ NEW IMPORT

export function useBookingConfirmationCelebration() {
  const { bookings } = useBookingListener();
  const [justConfirmed, setJustConfirmed] = useState<Booking | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Find the most recently confirmed booking that we haven't shown yet
    const confirmed = bookings
      .filter((b) => b.status === "confirmed")
      .sort((a, b) => (b.confirmedAt || 0) - (a.confirmedAt || 0));

    if (confirmed.length > 0) {
      const latest = confirmed[0];
      if (latest.confirmedAt && !seenIds.has(latest.id)) {
        setJustConfirmed(latest);
        setSeenIds((prev) => new Set(prev).add(latest.id));
      }
    }
  }, [bookings, seenIds]);

  const dismiss = () => {
    setJustConfirmed(null);
  };

  return { justConfirmed, dismiss };
}