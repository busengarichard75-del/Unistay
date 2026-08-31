"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Home, Trash2, Info, MapPin, Ticket } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPropertyById, updateBedAvailability } from "@/services/propertyService";
import { deleteBooking, expireExpiredBookings } from "@/services/bookingService";
import { useBookingListener } from "@/hooks/useBookingListener";
import { useBookingConfirmationCelebration } from "@/hooks/useBookingConfirmationCelebration";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { BackButton } from "@/components/ui/BackButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { TermsModal } from "@/components/auth/TermsModal";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { BookingCountdown } from "@/components/BookingCountdown";
import { ConfirmationCelebration } from "@/components/ConfirmationCelebration";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

const PAYMENT_NUMBER = "+260 0771319817";

// ─── Helper functions with safe defaults ───
function statusMessage(booking: Booking) {
  if (!booking || !booking.status) {
    return { text: "Status unknown", color: "var(--nexora-text-secondary)" };
  }

  if (booking.status === "requested") {
    return { text: "Waiting for landlord approval", color: "var(--nexora-warning)" };
  }
  if (booking.status === "approved") {
    return {
      text: `Pay K100 agent fee to ${PAYMENT_NUMBER} to confirm your booking`,
      color: "var(--nexora-primary)",
    };
  }
  if (booking.status === "rejected") {
    return { text: "Request rejected by landlord", color: "var(--nexora-danger)" };
  }
  if (booking.status === "expired") {
    return { text: "Approval expired", color: "var(--nexora-danger)" };
  }
  return { text: "Booking confirmed!", color: "var(--nexora-success)" };
}

function getBadgeStyles(status: string | undefined) {
  if (!status) {
    return "bg-gray-100 text-gray-500";
  }
  switch (status) {
    case "requested":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusDisplayName(status: string | undefined) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function StudentDashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const userLocation = useGeolocation();

  // ─── Real-time bookings ───
  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookingListener();

  // ─── Confirmation celebration ───
  const { justConfirmed, dismiss } = useBookingConfirmationCelebration();

  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [isFetchingProperties, setIsFetchingProperties] = useState(true);

  // ─── Fetch user data and expire bookings ───
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.fullName) setUserFullName(data.fullName);
          if (data?.hasAcceptedTerms === false) {
            setShowTermsModal(true);
          }
        }
      } catch {
        // Silent fail
      }
    };
    fetchUserData();

    // Check for expired bookings when dashboard loads
    const checkExpired = async () => {
      try {
        await expireExpiredBookings(user.uid);
      } catch (error) {
        console.error("Failed to check expired bookings:", error);
      }
    };
    checkExpired();
  }, [user]);

  // ─── Fetch property details for map ───
  useEffect(() => {
    if (!bookings.length) {
      setPropertyMap({});
      setIsFetchingProperties(false);
      return;
    }

    setIsFetchingProperties(true);
    const fetchProperties = async () => {
      const map: Record<string, Property> = {};
      const propertyPromises = bookings.map(async (booking) => {
        const property = await getPropertyById(booking.propertyId);
        if (property) map[booking.propertyId] = property;
      });
      await Promise.all(propertyPromises);
      setPropertyMap(map);
      setIsFetchingProperties(false);
    };
    fetchProperties();
  }, [bookings]);

  // ─── Handle delete ───
  async function handleDelete(bookingId: string) {
    if (!window.confirm("Remove this confirmed booking from your history?")) return;
    try {
      await deleteBooking(bookingId);
      toast.success("Booking removed successfully.");
    } catch {
      toast.error("Failed to delete booking. Please try again.");
    }
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const isFetching = bookingsLoading || isFetchingProperties;

  // ✅ Filter out any bookings without a status
  const validBookings = bookings.filter((b) => b && b.status);

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ─── Header ─── */}
        <div className="card-premium p-6 bg-[var(--nexora-navy)] text-white">
          <p className="text-sm text-gray-300">Welcome back</p>
          <h1 className="mt-1 text-xl font-bold">{userFullName || user.email}</h1>
          {userFullName && <p className="mt-0.5 text-xs text-gray-400">{user.email}</p>}
        </div>

        {/* ─── Notification Opt-In Banner ─── */}
        <div className="mt-6">
          <NotificationOptIn variant="banner" />
        </div>

        {bookingsError && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            Failed to load bookings. Please refresh.
          </div>
        )}

        {/* ─── My Bookings ─── */}
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
            My Bookings
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({validBookings.length})
            </span>
          </h2>

          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-1 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mb-1 h-3 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : validBookings.length === 0 ? (
            /* ─── Empty State ─── */
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                <Home size={28} />
              </div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                No bookings yet
              </p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                Discover verified accommodation near your campus.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
              >
                <Home size={16} />
                Find Your First Room →
              </Link>
            </div>
          ) : (
            <>
              {/* ─── Helper note ─── */}
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
                <Info size={16} className="shrink-0 mt-0.5 text-gray-400" />
                <span>
                  You can only remove <strong className="text-gray-500">confirmed</strong> bookings from your history.
                </span>
              </div>

              <div className="space-y-4">
                {validBookings.map((booking) => {
                  const status = statusMessage(booking);
                  const property = propertyMap[booking.propertyId];
                  const hasCoordinates =
                    property?.latitude !== undefined && property?.longitude !== undefined;
                  const isConfirmed = booking.status === "confirmed";
                  const isApproved = booking.status === "approved";
                  const isExpired = booking.status === "expired";

                  const defaultCenter: [number, number] =
                    userLocation.latitude && userLocation.longitude
                      ? [userLocation.latitude, userLocation.longitude]
                      : hasCoordinates
                      ? [property!.latitude!, property!.longitude!]
                      : [-15.3875, 28.3228];

                  return (
                    <div
                      key={booking.id}
                      className={`rounded-2xl bg-white p-4 shadow-sm ${
                        isExpired ? "opacity-60" : ""
                      }`}
                    >
                      {/* ─── Top row ─── */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.propertyTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            K{booking.price.toLocaleString()}/
                            {booking.paymentPeriod === "termly" ? "term" : "month"}
                          </p>
                          {/* ─── Countdown for approved bookings ─── */}
                          {isApproved && <BookingCountdown booking={booking} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeStyles(booking.status)}`}
                          >
                            {getStatusDisplayName(booking.status)}
                          </span>
                          {isConfirmed && (
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="rounded-full p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                              aria-label="Delete booking"
                              title="Remove this confirmed booking from your history"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ─── Status message ─── */}
                      <p
                        className="mt-1.5 text-xs font-medium"
                        style={{ color: status.color }}
                      >
                        {status.text}
                      </p>

                      {/* ─── Action Required (approved bookings) – no button ─── */}
                      {isApproved && (
                        <div className="mt-2 rounded-md border-l-4 border-[var(--nexora-primary)] bg-blue-50 px-3 py-2 text-xs text-blue-800">
                          <span className="font-semibold">Action Required:</span> {status.text}
                          {/* ❌ Removed Confirm Booking button */}
                        </div>
                      )}

                      {/* ─── Expired message ─── */}
                      {isExpired && (
                        <div className="mt-2 rounded-md border-l-4 border-gray-400 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                          This approval has expired. The bed is now available again.
                        </div>
                      )}

                      {/* ─── "View Confirmation" (confirmed only) ─── */}
                      {isConfirmed && (
                        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                          <Link
                            href={`/booking/confirmation/${booking.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-200"
                          >
                            <Ticket size={14} />
                            View Your Booking Pass →
                          </Link>
                        </div>
                      )}

                      {/* ─── Map (confirmed only) ─── */}
                      {isConfirmed && hasCoordinates && property && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                              <MapPin size={14} className="text-[var(--nexora-primary)]" />
                              Property Location
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-[var(--nexora-primary)] hover:underline"
                            >
                              Open Directions ↗
                            </a>
                          </div>
                          <PropertyMap
                            latitude={property.latitude}
                            longitude={property.longitude}
                            height="clamp(150px, 25vw, 250px)"
                            selectable={false}
                            defaultCenter={defaultCenter}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Confirmation Celebration Modal ─── */}
      <ConfirmationCelebration booking={justConfirmed} onDismiss={dismiss} />

      {/* ─── Terms Modal ─── */}
      {showTermsModal && user && (
        <TermsModal userId={user.uid} onAccept={() => setShowTermsModal(false)} />
      )}
    </main>
  );
}