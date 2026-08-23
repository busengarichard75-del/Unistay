"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Home, Trash2, Info, MapPin, Ticket } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getBookingsByStudent, deleteBooking } from "@/services/bookingService";
import { getPropertyById } from "@/services/propertyService";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { BackButton } from "@/components/ui/BackButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { TermsModal } from "@/components/auth/TermsModal";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

const PAYMENT_NUMBER = "+260 0771319817";

// --- Helper: status message (text + color) ---
function statusMessage(booking: Booking) {
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
  return { text: "Booking confirmed!", color: "var(--nexora-success)" };
}

// --- Helper: badge styles for status pills ---
function getBadgeStyles(status: string) {
  switch (status) {
    case "requested":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function StudentDashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const userLocation = useGeolocation();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [userFullName, setUserFullName] = useState<string | null>(null);

  // ─── Check terms + fetch user's full name ───
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
        // Silent fail – don't block the dashboard
      }
    };
    fetchUserData();
  }, [user]);

  // ─── Fetch bookings ───
  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      try {
        const data = await getBookingsByStudent(user.uid);
        setBookings(data);

        const propertyPromises = data.map(async (booking) => {
          const property = await getPropertyById(booking.propertyId);
          return { id: booking.propertyId, property };
        });
        const propertyResults = await Promise.all(propertyPromises);
        const map: Record<string, Property> = {};
        propertyResults.forEach(({ id, property }) => {
          if (property) map[id] = property;
        });
        setPropertyMap(map);
      } catch {
        setError("Failed to load your bookings. Please try again.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchBookings();
  }, [user]);

  async function handleDelete(bookingId: string) {
    if (!window.confirm("Remove this confirmed booking from your history?")) return;
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
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
          {userFullName && (
            <p className="mt-0.5 text-xs text-gray-400">{user.email}</p>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ─── My Bookings ─── */}
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
            My Bookings
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({bookings.length})
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
          ) : bookings.length === 0 ? (
            /* ─── Improved Empty State ─── */
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
              {/* ─── Faded helper note ─── */}
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
                <Info size={16} className="shrink-0 mt-0.5 text-gray-400" />
                <span>
                  You can only remove <strong className="text-gray-500">confirmed</strong> bookings from your history.
                </span>
              </div>

              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = statusMessage(booking);
                  const property = propertyMap[booking.propertyId];
                  const hasCoordinates =
                    property?.latitude !== undefined &&
                    property?.longitude !== undefined;
                  const isConfirmed = booking.status === "confirmed";
                  const isApproved = booking.status === "approved";

                  const defaultCenter: [number, number] =
                    userLocation.latitude && userLocation.longitude
                      ? [userLocation.latitude, userLocation.longitude]
                      : hasCoordinates
                      ? [property!.latitude!, property!.longitude!]
                      : [-15.3875, 28.3228];

                  return (
                    <div
                      key={booking.id}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      {/* ─── Top row: title, price, status pill, delete ─── */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.propertyTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            K{booking.price.toLocaleString()}/
                            {booking.paymentPeriod === "termly" ? "term" : "month"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeStyles(
                              booking.status
                            )}`}
                          >
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                          {/* Delete button (only for confirmed) */}
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

                      {/* ─── Action Required box (for approved bookings) ─── */}
                      {isApproved && (
                        <div className="mt-2 rounded-md border-l-4 border-[var(--nexora-primary)] bg-blue-50 px-3 py-2 text-xs text-blue-800">
                          <span className="font-semibold">Action Required:</span>{" "}
                          {status.text}
                        </div>
                      )}

                      {/* ─── "View Confirmation" – MOVED ABOVE MAP ─── */}
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

                      {/* ─── Map (only for confirmed) ─── */}
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

      {/* Terms Modal */}
      {showTermsModal && user && (
        <TermsModal
          userId={user.uid}
          onAccept={() => setShowTermsModal(false)}
        />
      )}
    </main>
  );
}