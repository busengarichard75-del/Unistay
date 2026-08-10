"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2, Check, X, Pencil, Eye, Search, LayoutGrid, Calendar, Clock, Home, MapPin, Star, Info, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPropertiesByOwner, deleteProperty, getPropertyById, updateProperty } from "@/services/propertyService";
import { getBookingsForLandlord, updateBookingStatus } from "@/services/bookingService";
import { generateBookingConfirmationData } from "@/lib/bookingConfirmation";
import { Property } from "@/types/property";
import { Booking } from "@/types/booking";
import { BackButton } from "@/components/ui/BackButton";
import { isBoosted, getBoostDaysRemaining } from "@/lib/boostService";

const PAGE_SIZE = 6;

export default function LandlordDashboardPage() {
  const { user, isLoading } = useRequireAuth("landlord");
  const [listings, setListings] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<"listings" | "bookings" | "requests">("listings");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleListings, setVisibleListings] = useState(PAGE_SIZE);
  const [visibleBookings, setVisibleBookings] = useState(PAGE_SIZE);
  const [visibleRequests, setVisibleRequests] = useState(PAGE_SIZE);

  // Boost Modal State
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [boostPropertyId, setBoostPropertyId] = useState<string | null>(null);
  const [boostPropertyTitle, setBoostPropertyTitle] = useState("");
  const [isSubmittingBoost, setIsSubmittingBoost] = useState(false);

  useEffect(() => {
    setVisibleListings(PAGE_SIZE);
    setVisibleBookings(PAGE_SIZE);
    setVisibleRequests(PAGE_SIZE);
  }, [activeTab, searchTerm]);

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
        setError(null);
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
        // ✅ FIX: use optional chaining / fallback for bedSpaces
        const updatedBedSpaces = (property.bedSpaces ?? []).map((bed) =>
          bed.id === booking.bedSpaceId ? { ...bed, isAvailable: false } : bed
        );
        await updateProperty(property.id, { bedSpaces: updatedBedSpaces });
      }
      let updatePayload: any = { status: "approved" };
      if (booking.status === "requested") {
        const confirmationData = await generateBookingConfirmationData();
        updatePayload = {
          ...updatePayload,
          confirmationId: confirmationData.confirmationId,
          confirmationCode: confirmationData.confirmationCode,
          verificationToken: confirmationData.verificationToken,
          approvedAt: confirmationData.approvedAt,
        };
      }
      await updateBookingStatus(booking.id, updatePayload);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: "approved",
                ...(booking.status === "requested" && {
                  confirmationId: updatePayload.confirmationId,
                  confirmationCode: updatePayload.confirmationCode,
                  verificationToken: updatePayload.verificationToken,
                  approvedAt: updatePayload.approvedAt,
                }),
              }
            : b
        )
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
        const updatedBedSpaces = (property.bedSpaces ?? []).map((bed) =>
          bed.id === booking.bedSpaceId ? { ...bed, isAvailable: true } : bed
        );
        await updateProperty(property.id, { bedSpaces: updatedBedSpaces });
      }
      await updateBookingStatus(booking.id, { status: "rejected" });
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: "rejected" } : b))
      );
      toast.success("Booking rejected successfully.");
    } catch {
      toast.error("Failed to reject booking. Please try again.");
    }
  }

  // Boost handlers
  const openBoostModal = (property: Property) => {
    setBoostPropertyId(property.id);
    setBoostPropertyTitle(property.title);
    setBoostModalOpen(true);
  };

  const closeBoostModal = () => {
    setBoostModalOpen(false);
    setBoostPropertyId(null);
    setBoostPropertyTitle("");
    setIsSubmittingBoost(false);
  };

  const requestedBookings = bookings.filter((b) => b.status === "requested");

  const filterBySearch = <T extends Property | Booking>(items: T[], term: string, searchKeys: (keyof T)[]): T[] => {
    if (!term.trim()) return items;
    const query = term.toLowerCase().trim();
    return items.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return typeof value === "string" && value.toLowerCase().includes(query);
      })
    );
  };

  const filteredListings = filterBySearch(listings, searchTerm, ["title", "location"]);
  const filteredBookings = filterBySearch(bookings, searchTerm, ["propertyTitle", "studentName"]);
  const filteredRequests = filterBySearch(requestedBookings, searchTerm, ["propertyTitle", "studentName"]);

  const paginatedListings = filteredListings.slice(0, visibleListings);
  const paginatedBookings = filteredBookings.slice(0, visibleBookings);
  const paginatedRequests = filteredRequests.slice(0, visibleRequests);

  const hasMoreListings = filteredListings.length > visibleListings;
  const hasMoreBookings = filteredBookings.length > visibleBookings;
  const hasMoreRequests = filteredRequests.length > visibleRequests;

  const stats = {
    listings: listings.length,
    bookings: bookings.length,
    requests: requestedBookings.length,
  };

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

        {/* Header + Add Listing */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--nexora-navy)] p-5">
          <div>
            <p className="text-sm text-gray-300">Welcome back</p>
            <h1 className="text-xl font-bold text-white">{user.email}</h1>
            <div className="mt-1 flex gap-3 text-xs text-gray-300">
              <span>{stats.listings} listings</span>
              <span>•</span>
              <span>{stats.bookings} bookings</span>
              <span>•</span>
              <span>{stats.requests} pending</span>
            </div>
          </div>
          <Link
            href="/dashboard/landlord/add-listing"
            className="flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
          >
            <Plus size={16} />
            Add Listing
          </Link>
        </div>

        {/* Reminder Banner */}
        <div className="mt-6 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200 flex items-center gap-2">
          <span>📱</span>
          <span>
            Make sure you have added your <strong>phone number</strong> in your{" "}
            <Link href="/dashboard/profile" className="font-medium underline hover:text-amber-800">
              Profile
            </Link>{" "}
            so students can contact you after booking.
          </span>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "listings" ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutGrid size={16} />
            Listings ({stats.listings})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "bookings" ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Calendar size={16} />
            Bookings ({stats.bookings})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "requests" ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Clock size={16} />
            Requests ({stats.requests})
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {isFetching ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-2 h-32 w-full rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-1 h-3 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* LISTINGS TAB */}
              {activeTab === "listings" && (
                <>
                  {paginatedListings.length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                      <Home size={32} className="mx-auto text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        {searchTerm ? "No listings match your search." : "You haven't listed any boarding houses yet."}
                      </p>
                      {!searchTerm && (
                        <Link
                          href="/dashboard/landlord/add-listing"
                          className="mt-3 inline-block rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--nexora-primary-hover)]"
                        >
                          Add Your First Listing
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedListings.map((listing) => {
                          const boosted = isBoosted(listing);
                          const daysLeft = boosted ? getBoostDaysRemaining(listing) : 0;
                          return (
                            <div
                              key={listing.id}
                              className="group rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden relative"
                            >
                              {boosted && (
                                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black shadow-sm">
                                  <Star size={14} fill="currentColor" />
                                  Boosted
                                  {daysLeft > 0 && <span className="ml-1 text-[10px]">{daysLeft}d</span>}
                                </div>
                              )}
                              {listing.imageUrl && (
                                <div className="h-40 overflow-hidden">
                                  <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div className="p-4">
                                <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                  <MapPin size={12} />
                                  {listing.location}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                  <span className="font-bold text-gray-900">K{listing.price.toLocaleString()}</span>
                                  <span className="text-xs text-gray-500">{(listing.bedSpaces ?? []).length} beds</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                                  <div className="flex items-center gap-1">
                                    <Link
                                      href={`/dashboard/landlord/edit-listing/${listing.id}`}
                                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                      aria-label="Edit listing"
                                    >
                                      <Pencil size={16} />
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(listing.id)}
                                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                      aria-label="Delete listing"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                  {!boosted ? (
                                    <button
                                      onClick={() => openBoostModal(listing)}
                                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                                    >
                                      <Star size={14} className="inline mr-1" />
                                      Boost (K100)
                                    </button>
                                  ) : (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <Star size={14} fill="currentColor" className="text-yellow-400" />
                                      Boosted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasMoreListings && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={() => setVisibleListings((prev) => prev + PAGE_SIZE)}
                            className="rounded-full bg-white px-6 py-2 text-sm font-medium text-[var(--nexora-primary)] shadow-sm hover:bg-gray-50"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* BOOKINGS TAB */}
              {activeTab === "bookings" && (
                <>
                  {paginatedBookings.length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                      <Calendar size={32} className="mx-auto text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        {searchTerm ? "No bookings match your search." : "No bookings yet."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedBookings.map((booking) => {
                          const statusColor =
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "approved"
                              ? "bg-blue-100 text-blue-700"
                              : booking.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700";
                          return (
                            <div
                              key={booking.id}
                              className="flex flex-wrap items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">{booking.propertyTitle}</p>
                                <p className="text-xs text-gray-500">
                                  {booking.studentName} • K{booking.price.toLocaleString()} /{booking.paymentPeriod === "termly" ? "term" : "month"}
                                </p>
                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                                  {booking.status}
                                </span>
                                {booking.confirmationId && (
                                  <span className="ml-2 text-xs text-gray-400">ID: {booking.confirmationId}</span>
                                )}
                              </div>
                              <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0">
                                <Link
                                  href={`/verify/${booking.id}`}
                                  target="_blank"
                                  className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Eye size={14} />
                                  Verify
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasMoreBookings && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={() => setVisibleBookings((prev) => prev + PAGE_SIZE)}
                            className="rounded-full bg-white px-6 py-2 text-sm font-medium text-[var(--nexora-primary)] shadow-sm hover:bg-gray-50"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* REQUESTS TAB */}
              {activeTab === "requests" && (
                <>
                  {paginatedRequests.length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                      <Clock size={32} className="mx-auto text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        {searchTerm ? "No requests match your search." : "No pending booking requests."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedRequests.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-wrap items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{booking.propertyTitle}</p>
                              <p className="text-xs text-gray-500">
                                Requested by {booking.studentName} • K{booking.price.toLocaleString()} /{booking.paymentPeriod === "termly" ? "term" : "month"}
                              </p>
                            </div>
                            <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0">
                              <button
                                onClick={() => handleReject(booking)}
                                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <X size={14} />
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(booking)}
                                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors"
                                style={{ backgroundColor: "var(--nexora-success)" }}
                              >
                                <Check size={14} />
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {hasMoreRequests && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={() => setVisibleRequests((prev) => prev + PAGE_SIZE)}
                            className="rounded-full bg-white px-6 py-2 text-sm font-medium text-[var(--nexora-primary)] shadow-sm hover:bg-gray-50"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Boost Modal */}
      {boostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--nexora-text-primary)]">Boost Listing</h3>
              <button
                onClick={closeBoostModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You are about to boost <strong>{boostPropertyTitle}</strong>.
              </p>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">Payment Instructions</p>
                <p className="mt-1">Pay <strong>K100</strong> via Mobile Money to:</p>
                <p className="mt-1 font-mono text-base">+260 0771319817</p>
                <p className="mt-1 text-xs text-blue-600">Reference: Boost {boostPropertyId?.slice(0, 8)}</p>
              </div>
              <p className="text-xs text-gray-500">
                After payment, contact support or wait for admin to activate your boost. It will be active for 30 days.
              </p>
              <button
                onClick={() => {
                  toast.info("Boost request sent. Admin will review and activate.");
                  closeBoostModal();
                }}
                className="w-full rounded-full bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
              >
                I Have Paid (Request Activation)
              </button>
              <button
                onClick={closeBoostModal}
                className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}