// src/components/BookingCountdown.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Booking } from "@/types/booking";
import { getRemainingTime, formatRemainingTime } from "@/lib/bookingExpiration";

interface BookingCountdownProps {
  booking: Booking;
}

export function BookingCountdown({ booking }: BookingCountdownProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Only show countdown for approved bookings
    if (booking.status !== "approved" || !booking.approvalExpiresAt) {
      setTime("");
      return;
    }

    const updateTimer = () => {
      const formatted = formatRemainingTime(booking);
      setTime(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
      <Clock size={14} className="shrink-0" />
      <span className="font-mono font-semibold">{time}</span>
      <span className="text-xs text-blue-500">remaining</span>
    </div>
  );
}