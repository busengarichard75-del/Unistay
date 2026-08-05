"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Search, User, Home, Calendar, DollarSign, Megaphone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { getAllApprovedBookings, updateBookingStatus } from "@/services/bookingService";
import { getAnnouncement, updateAnnouncement, Announcement } from "@/services/announcementService";
import { Booking } from "@/types/booking";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Announcement state
  const [announceContent, setAnnounceContent] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isUpdatingAnnounce, setIsUpdatingAnnounce] = useState(false);
  const [loadingAnnounce, setLoadingAnnounce] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAdminEmail(user?.email)) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getAllApprovedBookings();
        setBookings(data);
        setFilteredBookings(data);
        setError(null);
      } catch {
        setError("Failed to load pending payments. Please try again.");
      } finally {
        setIsFetching(false);
      }
    };

    const fetchAnnounce = async () => {
      try {
        const data = await getAnnouncement();
        if (data) {
          setAnnounceContent(data.content || "");
          setIsActive(data.isActive || false);
        }
      } catch {
        // silent fail
      } finally {
        setLoadingAnnounce(false);
      }
    };

    fetchData();
    fetchAnnounce();
  }, [user, isLoading, router]);

  // Search/filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBookings(bookings);
      return;
    }
    const query = searchTerm.toLowerCase().trim();
    const filtered = bookings.filter(
      (b) =>
        b.studentName.toLowerCase().includes(query) ||
        b.propertyTitle.toLowerCase().includes(query) ||
        b.studentId.toLowerCase().includes(query)
    );
    setFilteredBookings(filtered);
  }, [searchTerm, bookings]);

  // Booking actions
  async function handleMarkPaid(bookingId: string) {
    setIsSubmitting(bookingId);
    try {
      await updateBookingStatus(bookingId, "confirmed");
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setFilteredBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("Payment confirmed successfully!");
    } catch {
      toast.error("Failed to mark as paid. Please try again.");
    } finally {
      setIsSubmitting(null);
    }
  }

  // Announcement actions
  const handlePublishAnnounce = async () => {
    if (!announceContent.trim()) {
      toast.error("Please write a message.");
      return;
    }
    setIsUpdatingAnnounce(true);
    try {
      await updateAnnouncement({ content: announceContent.trim(), isActive: true });
      setIsActive(true);
      toast.success("Announcement published!");
    } catch {
      toast.error("Failed to publish announcement.");
    } finally {
      setIsUpdatingAnnounce(false);
    }
  };

  const handleHideAnnounce = async () => {
    setIsUpdatingAnnounce(true);
    try {
      await updateAnnouncement({ isActive: false });
      setIsActive(false);
      toast.success("Announcement hidden.");
    } catch {
      toast.error("Failed to hide announcement.");
    } finally {
      setIsUpdatingAnnounce(false);
    }
  };

  if (isLoading || !isAdminEmail(user?.email)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Navigation */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)] transition-colors"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">Admin Panel</span>
        </div>

        {/* ====== ANNOUNCEMENT MANAGER ====== */}
        <div className="card-premium bg-white p-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={20} className="text-[var(--nexora-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--nexora-text-primary)]">Announcement Banner</h2>
            {!loadingAnnounce && (
              <span
                className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {isActive ? (
                  <>
                    <Eye size={12} /> Active
                  </>
                ) : (
                  <>
                    <EyeOff size={12} /> Hidden
                  </>
                )}
              </span>
            )}
          </div>

          <textarea
            value={announceContent}
            onChange={(e) => setAnnounceContent(e.target.value)}
            placeholder="Write your announcement here (e.g., 'Welcome to CBU! New listings available.')"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
            disabled={loadingAnnounce}
          />

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={handlePublishAnnounce}
              disabled={isUpdatingAnnounce || loadingAnnounce}
              className="flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:bg-gray-300"
            >
              <Megaphone size={16} />
              {isUpdatingAnnounce ? "Publishing..." : "Publish"}
            </button>
            <button
              onClick={handleHideAnnounce}
              disabled={isUpdatingAnnounce || loadingAnnounce || !isActive}
              className="flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <EyeOff size={16} />
              Hide
            </button>
            {!loadingAnnounce && isActive && (
              <span className="self-center text-xs text-gray-400">
                Active – visible to all visitors
              </span>
            )}
          </div>
        </div>

        {/* ====== PENDING PAYMENTS ====== */}
        <div className="mt-8">
          <div className="flex items-center justify-between rounded-2xl bg-[var(--nexora-navy)] p-6">
            <div>
              <h1 className="text-xl font-bold text-white">Pending Payments</h1>
              <p className="mt-1 text-sm text-gray-300">
                Bookings approved by landlords, awaiting K80 agent fee payment.
              </p>
            </div>
            <div className="hidden rounded-full bg-white/10 px-4 py-2 text-sm text-white sm:block">
              {filteredBookings.length} pending
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mt-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, property, or ID..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
              />
            </div>
          </div>

          {/* Bookings list */}
          <div className="mt-6">
            {isFetching ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-2 h-5 w-2/3 rounded bg-gray-200" />
                    <div className="mb-1 h-4 w-1/2 rounded bg-gray-200" />
                    <div className="mb-1 h-4 w-1/3 rounded bg-gray-200" />
                    <div className="mt-3 h-9 w-1/2 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                {searchTerm ? (
                  <>
                    <p className="text-sm text-gray-500">
                      No pending payments match your search.
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-3 text-sm text-[var(--nexora-primary)] hover:underline"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Check
                      size={40}
                      className="mx-auto text-green-500"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm font-medium text-gray-700">
                      All caught up! 🎉
                    </p>
                    <p className="text-sm text-gray-500">
                      No pending payments to review.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="group rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-navy)]">
                            <User size={16} />
                          </div>
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {booking.studentName}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Pending
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                      <p className="text-sm font-medium text-gray-800">
                        {booking.propertyTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={13} />
                          K{booking.price.toLocaleString()}
                          <span className="text-gray-400">
                            /{booking.paymentPeriod === "termly" ? "term" : "month"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkPaid(booking.id)}
                      disabled={isSubmitting === booking.id}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--nexora-success)] py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting === booking.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <Check size={16} />
                          Confirm Payment
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          {filteredBookings.length} of {bookings.length} pending payment
          {bookings.length !== 1 ? "s" : ""}
          {searchTerm && " · filtered by search"}
        </div>
      </div>
    </main>
  );
}