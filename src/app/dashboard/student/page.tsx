"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Home, Trash2, Info, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getBookingsByStudent, deleteBooking } from "@/services/bookingService";
import { getPropertyById } from "@/services/propertyService";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { BackButton } from "@/components/ui/BackButton";
import { useGeolocation } from "@/hooks/useGeolocation";

// ✅ Dynamically import PropertyMap with SSR disabled
const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

const PAYMENT_NUMBER = "+260 0771319817";

function statusMessage(booking: Booking) {
  if (booking.status === "requested") {
    return { text: "Waiting for landlord approval", color: "var(--nexora-warning)" };
  }
  if (booking.status === "approved") {
    return {
      text: `Pay K80 agent fee to ${PAYMENT_NUMBER} to confirm your booking`,
      color: "var(--nexora-primary)",
    };
  }
  if (booking.status === "rejected") {
    return { text: "Request rejected by landlord", color: "var(--nexora-danger)" };
  }
  return { text: "Booking confirmed!", color: "var(--nexora-success)" };
}

export default function StudentDashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const userLocation = useGeolocation();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({});

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
    if (!window.confirm("Remove this booking from your history?")) return;
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

        <div className="card-premium p-6 bg-[var(--nexora-navy)] text-white">
          <p className="text-sm text-gray-300">Welcome back</p>
          <h1 className="mt-1 text-xl font-bold">{user.email}</h1>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">My Bookings</h2>

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
            <div className="card-premium p-8 text-center">
              <p className="text-sm text-[var(--nexora-text-secondary)]">
                You haven't booked any bed spaces yet.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
              >
                <Home size={16} />
                Browse boarding houses
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-[var(--nexora-text-secondary)]">
                <Info size={16} className="shrink-0 mt-0.5 text-[var(--nexora-primary)]" />
                <span>You can only remove <strong>confirmed</strong> bookings from your history.</span>
              </div>
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = statusMessage(booking);
                  const property = propertyMap[booking.propertyId];
                  const hasCoordinates = property?.latitude !== undefined && property?.longitude !== undefined;
                  const isConfirmed = booking.status === "confirmed";

                  const defaultCenter: [number, number] = userLocation.latitude && userLocation.longitude
                    ? [userLocation.latitude, userLocation.longitude]
                    : hasCoordinates
                    ? [property!.latitude!, property!.longitude!]
                    : [-15.3875, 28.3228];

                  return (
                    <div
                      key={booking.id}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.propertyTitle}</p>
                          <p className="text-xs text-gray-500">
                            K{booking.price.toLocaleString()}/{booking.paymentPeriod === "termly" ? "term" : "month"}
                          </p>
                          <p className="mt-2 text-xs font-semibold" style={{ color: status.color }}>
                            {status.text}
                          </p>
                        </div>
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete booking"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      {/* Map – only for confirmed bookings with coordinates */}
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
                            height="150px"
                            selectable={false}
                            defaultCenter={defaultCenter}
                          />
                        </div>
                      )}

                      {/* View Confirmation button */}
                      {(booking.status === "approved" || booking.status === "confirmed") && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <Link
                            href={`/booking/confirmation/${booking.id}`}
                            target="_blank"
                            className="inline-block rounded-full bg-blue-100 px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200 transition"
                          >
                            View Confirmation
                          </Link>
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
    </main>
  );
}