// src/lib/bookingExpiration.ts
import { Booking } from "@/types/booking";

export const APPROVAL_EXPIRY_HOURS = 48;

export function isBookingExpired(booking: Booking): boolean {
  if (booking.status !== "approved") return false;
  if (!booking.approvalExpiresAt) return false;
  return Date.now() > booking.approvalExpiresAt;
}

export function getExpiryTimestamp(): number {
  return Date.now() + APPROVAL_EXPIRY_HOURS * 60 * 60 * 1000;
}

export function getRemainingTime(booking: Booking): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (!booking.approvalExpiresAt) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const diff = booking.approvalExpiresAt - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return { hours, minutes, seconds };
}

export function formatRemainingTime(booking: Booking): string {
  const { hours, minutes, seconds } = getRemainingTime(booking);
  if (hours === 0 && minutes === 0 && seconds === 0) return "Expired";
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}