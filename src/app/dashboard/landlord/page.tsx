"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPropertiesByOwner, deleteProperty, getPropertyById, updateProperty } from "@/services/propertyService";
import { getBookingsForLandlord, updateBookingStatus } from "@/services/bookingService";
import { Property } from "@/types/property";
import { Booking } from "@/types/booking";
import { BackButton } from "@/components/ui/BackButton";

export default function LandlordDashboardPage() {
  const { user, isLoading } = useRequireAuth("landlord");
  const [listings, setListings] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [propertiesData, bookingsData] = await Promise.all([
          getPropertiesByOwner(user.uid),
          getBookingsForLandlord(user.uid),
        ]);
        setListings(propertiesData);
        setBookings(bookingsData);
      } catch {
        setError("Failed to load your dashboard. Please try again.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [user]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await deleteProperty(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing deleted successfully.");
    } catch {
      toast.error("Failed to delete listing. Please try again.");
    }
  }

  async function handleApprove(booking: Booking) {
    try {
      const property = await getPropertyById(booking.propertyId);
      if (property) {
        const updatedBedSpaces = property.bedSpaces.map((bed) =>
          bed.id === booking.bedSpaceId ? { ...bed, isAvailable: false } : bed
        );
        await updateProperty(property.id, { bedSpaces: updatedBedSpaces });
      }
      await updateBookingStatus(booking.id, "approved");
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: "approved" } : b))
      );
      toast.success("Booking approved successfully!");
    } catch {
      toast.error("Failed to approve booking. Please try again.");
    }
  }

  async function handleReject(booking: Booking) {
    if (!window.confirm("Reject this booking request?")) return;
    try {
      const property = await getPropertyById(booking.propertyId);
      if (property) {
        const updatedBedSpaces = property.bedSpaces.map((bed) =>
          bed.id === booking.bedSpaceId ? { ...bed, isAvailable: true } : bed
        );
        await updateProperty(property.id, { bedSpaces: updatedBedSpaces });
      }
      await updateBookingStatus(booking.id, "rejected");
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: "rejected" } : b))
      );
      toast.success("Booking rejected successfully.");
    } catch {
      toast.error("Failed to reject booking. Please try again.");
    }
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const requestedBookings = bookings.filter((b) => b.status === "requested");

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-[var(--nexora-navy)] p-6">
          <div>
            <p className="text-sm text-gray-300">Welcome back</p>
            <h1 className="mt-1 text-xl font-bold text-white">{user.email}</h1>
          </div>
          <Link
            href="/dashboard/landlord/add-listing"
            className="flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
          >
            <Plus size={16} />
            Add Listing
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">Booking Requests</h2>

          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-1 h-4 w-1/2 rounded bg-gray-200" />
                  <div className="mb-1 h-3 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/4 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : requestedBookings.length === 0 ? (
            <div className="card-premium p-6 text-center">
              <p className="text-sm text-[var(--nexora-text-secondary)]">No pending booking requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requestedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{booking.propertyTitle}</p>
                    <p className="text-xs text-gray-500">
                      Requested by {booking.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      K{booking.price.toLocaleString()}/{booking.paymentPeriod === "termly" ? "term" : "month"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(booking)}
                      className="flex items-center gap-1 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(booking)}
                      className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: "var(--nexora-success)" }}
                    >
                      <Check size={16} />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">My Listings</h2>

          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-1 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mb-1 h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="card-premium p-8 text-center">
              <p className="text-sm text-[var(--nexora-text-secondary)]">You haven't listed any boarding houses yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                    <p className="text-xs text-gray-500">{listing.location}</p>
                    <p className="text-xs text-gray-500">
                      K{listing.price.toLocaleString()}/{listing.paymentPeriod === "termly" ? "term" : "month"} · {listing.bedSpaces.length} bed spaces
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/landlord/edit-listing/${listing.id}`}
                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      aria-label="Edit listing"
                    >
                      <Pencil size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete listing"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}