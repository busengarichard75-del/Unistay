"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, User, Home, Calendar, DollarSign, Megaphone, Eye, EyeOff, Star, RefreshCw, LayoutGrid, TrendingUp, Clock, CreditCard, Users, Landmark, Briefcase, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { getAllApprovedBookings, updateBookingStatus } from "@/services/bookingService";
import { getAnnouncement, updateAnnouncement, Announcement } from "@/services/announcementService";
import { getAllProperties, updateProperty } from "@/services/propertyService";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { isBoosted, getBoostDaysRemaining } from "@/lib/boostService";

const AGENT_FEE = 100;
const BOOST_FEE = 100;
const ADMIN_PIN = "3542";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // PIN state
  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");

  // Data states
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

  // Boost Management state
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [boostSearchTerm, setBoostSearchTerm] = useState("");
  const [isTogglingBoost, setIsTogglingBoost] = useState<string | null>(null);

  // Stats reset flag
  const [statsReset, setStatsReset] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false); // Only used for stats loading

  // Stats
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    pendingPayments: 0,
    boostedListings: 0,
    totalStudents: 0,
    totalLandlords: 0,
    completedBookings: 0,
    boostRevenue: 0,
    agentFeeRevenue: 0,
    totalRevenue: 0,
  });

  // ─── Fetch all data ──────────────────────────────────────────
  const fetchAllData = async () => {
    setIsFetching(true);
    setIsFetchingProperties(true);
    setLoadingSettings(true);
    try {
      // Bookings
      const bookingsData = await getAllApprovedBookings();
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);

      // Properties
      const props = await getAllProperties();
      setAllProperties(props);

      // Users (students & landlords)
      const usersRef = collection(db, "users");
      const studentQuery = query(usersRef, where("role", "==", "student"));
      const landlordQuery = query(usersRef, where("role", "==", "landlord"));
      const [studentSnap, landlordSnap] = await Promise.all([
        getDocs(studentQuery),
        getDocs(landlordQuery),
      ]);
      const totalStudents = studentSnap.size;
      const totalLandlords = landlordSnap.size;

      // All bookings for stats
      const allBookingsRef = collection(db, "bookings");
      const allBookingsSnap = await getDocs(allBookingsRef);
      const allBookingsList = allBookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
      const totalBookings = allBookingsList.length;
      const completedBookings = allBookingsList.filter((b) => b.status === "confirmed").length;
      const pendingPayments = allBookingsList.filter((b) => b.status === "approved").length;

      const boosted = props.filter((p) => isBoosted(p)).length;
      const boostRevenue = boosted * BOOST_FEE;
      const agentFeeRevenue = completedBookings * AGENT_FEE;
      const totalRevenue = boostRevenue + agentFeeRevenue;

      setStats({
        totalProperties: props.length,
        totalBookings,
        pendingPayments,
        boostedListings: boosted,
        totalStudents,
        totalLandlords,
        completedBookings,
        boostRevenue,
        agentFeeRevenue,
        totalRevenue,
      });

      setError(null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load admin data. Please try again.");
    } finally {
      setIsFetching(false);
      setIsFetchingProperties(false);
      setLoadingSettings(false);
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

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, "settings", "main");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setStatsReset(data.statsReset || false);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingSettings(false);
    }
  };

  // ─── Effects ─────────────────────────────────────────────────
  // 1. Redirect non‑admin users
  useEffect(() => {
    if (isLoading) return;
    if (!isAdminEmail(user?.email)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // 2. Fetch data and settings when PIN is verified
  useEffect(() => {
    if (isLoading || !isPinVerified || !user) return;
    fetchAllData();
    fetchAnnounce();
    fetchSettings();
  }, [isPinVerified, user, isLoading]);

  // Search/filter for bookings
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBookings(bookings);
      return;
    }
    const queryStr = searchTerm.toLowerCase().trim();
    const filtered = bookings.filter(
      (b) =>
        b.studentName.toLowerCase().includes(queryStr) ||
        b.propertyTitle.toLowerCase().includes(queryStr) ||
        b.studentId.toLowerCase().includes(queryStr)
    );
    setFilteredBookings(filtered);
  }, [searchTerm, bookings]);

  // ─── Handlers ────────────────────────────────────────────────

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsPinVerified(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Try again.");
      setPin("");
    }
  };

  // Booking: mark as paid
  async function handleMarkPaid(bookingId: string) {
    setIsSubmitting(bookingId);
    try {
      await updateBookingStatus(bookingId, {
        status: "confirmed",
        confirmedAt: Date.now(),
      });
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setFilteredBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("Payment confirmed successfully!");
    } catch {
      toast.error("Failed to mark as paid. Please try again.");
    } finally {
      setIsSubmitting(null);
    }
  }

  // Announcement
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

  // Boost
  const handleToggleBoost = async (property: Property) => {
    setIsTogglingBoost(property.id);
    try {
      const isCurrentlyBoosted = isBoosted(property);
      const newBoosted = !isCurrentlyBoosted;
      const updateData: any = {
        isBoosted: newBoosted,
        boostedAt: newBoosted ? Date.now() : null,
        boostExpiry: newBoosted ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
      };
      await updateProperty(property.id, updateData);
      setAllProperties((prev) =>
        prev.map((p) =>
          p.id === property.id ? { ...p, ...updateData } : p
        )
      );
      toast.success(`Property ${newBoosted ? "boosted" : "unboosted"} successfully!`);
    } catch {
      toast.error("Failed to update boost status.");
    } finally {
      setIsTogglingBoost(null);
    }
  };

  // Stats reset
  const handleResetStats = async () => {
    if (!window.confirm("Are you sure you want to reset all stats to zero? This does not delete any data – it only hides the numbers until you restore them.")) return;
    try {
      await setDoc(doc(db, "settings", "main"), { statsReset: true }, { merge: true });
      setStatsReset(true);
      toast.success("Stats have been reset (hidden).");
    } catch {
      toast.error("Failed to reset stats.");
    }
  };

  const handleShowStats = async () => {
    try {
      await setDoc(doc(db, "settings", "main"), { statsReset: false }, { merge: true });
      setStatsReset(false);
      toast.success("Stats are now visible again.");
    } catch {
      toast.error("Failed to restore stats.");
    }
  };

  // ─── Render ──────────────────────────────────────────────────

  // Show loader only during auth loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-700" />
        </div>
      </div>
    );
  }

  // PIN overlay (shown immediately after auth)
  if (!isPinVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-gray-900/50 rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={28} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Admin Access</h2>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Enter 4-digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-center text-2xl text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••"
                autoFocus
              />
              {pinError && <p className="mt-2 text-sm text-red-400">{pinError}</p>}
            </div>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────────────

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  // Filter properties for boost management
  const filteredPropertiesForBoost = allProperties.filter((p) =>
    p.title.toLowerCase().includes(boostSearchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(boostSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">🚀</span>
              UniStay Admin Studio
            </h1>
            <p className="text-sm text-gray-400 mt-1">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-900/30 border border-red-800 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ========== TOP: Actionable Sections ========== */}
        {/* 1. Pending Payments */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-green-400" />
              <h2 className="text-lg font-semibold text-white">Pending Payments (K{AGENT_FEE})</h2>
            </div>
            <span className="text-sm text-gray-400">{filteredBookings.length} pending</span>
          </div>

          <div className="mb-4 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, property, or ID..."
              className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Check size={40} className="mx-auto text-green-500" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-300 mt-2">All caught up! 🎉</p>
              <p className="text-sm text-gray-500">No pending payments to review.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-4 hover:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{booking.studentName}</p>
                    <p className="text-xs text-gray-400">
                      {booking.propertyTitle} • K{booking.price.toLocaleString()}
                    </p>
                    <span className="inline-block mt-1 rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-800">
                      Pending
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkPaid(booking.id)}
                    disabled={isSubmitting === booking.id}
                    className="mt-2 sm:mt-0 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
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

        {/* 2. Boost Management */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Boost Management</h2>
          </div>

          <div className="mb-4 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={boostSearchTerm}
              onChange={(e) => setBoostSearchTerm(e.target.value)}
              placeholder="Search properties by title or location..."
              className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {isFetchingProperties ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : filteredPropertiesForBoost.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No properties found.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {filteredPropertiesForBoost.map((property) => {
                const boosted = isBoosted(property);
                const daysLeft = boosted ? getBoostDaysRemaining(property) : 0;
                return (
                  <div
                    key={property.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-3 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{property.title}</p>
                      <p className="text-xs text-gray-400">{property.location}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {boosted && (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          {daysLeft}d
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleBoost(property)}
                        disabled={isTogglingBoost === property.id}
                        className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                          boosted
                            ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800 hover:bg-yellow-900/50"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {isTogglingBoost === property.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : boosted ? (
                          "Unboost"
                        ) : (
                          "Boost"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Announcements */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Announcements</h2>
            {!loadingAnnounce && (
              <span
                className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-gray-800 text-gray-400 border border-gray-700"
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
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={loadingAnnounce}
          />

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={handlePublishAnnounce}
              disabled={isUpdatingAnnounce || loadingAnnounce}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400"
            >
              <Megaphone size={16} />
              {isUpdatingAnnounce ? "Publishing..." : "Publish"}
            </button>
            <button
              onClick={handleHideAnnounce}
              disabled={isUpdatingAnnounce || loadingAnnounce || !isActive}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              <EyeOff size={16} />
              Hide
            </button>
          </div>
        </div>

        {/* ========== BOTTOM: Stats & Revenue ========== */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Platform Stats</h2>
            </div>
            <div className="flex items-center gap-3">
              {statsReset ? (
                <button
                  onClick={handleShowStats}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Show Stats
                </button>
              ) : (
                <button
                  onClick={handleResetStats}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Reset Stats
                </button>
              )}
            </div>
          </div>

          {loadingSettings ? (
            <div className="animate-pulse space-y-4 py-8">
              <div className="h-16 bg-gray-800 rounded-lg" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-800 rounded-lg" />
                ))}
              </div>
            </div>
          ) : statsReset ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle size={40} className="mx-auto text-yellow-500 mb-3" />
              <p className="text-sm font-medium">Stats are currently reset (hidden).</p>
              <p className="text-xs text-gray-500">Click "Show Stats" to restore them.</p>
            </div>
          ) : (
            <>
              {/* Revenue Tracker */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-800/50 p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Landmark size={22} className="text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Revenue Tracker</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <p className="text-sm text-gray-400">Agent Fees</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.agentFeeRevenue)}</p>
                    <p className="text-xs text-gray-500">{stats.completedBookings} bookings × K{AGENT_FEE}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <p className="text-sm text-gray-400">Boost Revenue</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.boostRevenue)}</p>
                    <p className="text-xs text-gray-500">{stats.boostedListings} boosts × K{BOOST_FEE}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 rounded-lg p-4 border border-blue-700/50">
                    <p className="text-sm text-gray-300">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-blue-400">Combined total</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards (8) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Properties</span>
                    <LayoutGrid size={18} className="text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.totalProperties}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Bookings</span>
                    <Calendar size={18} className="text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.totalBookings}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Pending Payments</span>
                    <CreditCard size={18} className="text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.pendingPayments}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Boosted Listings</span>
                    <Star size={18} className="text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.boostedListings}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Students</span>
                    <Users size={18} className="text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.totalStudents}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Landlords</span>
                    <Briefcase size={18} className="text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.totalLandlords}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Completed Bookings</span>
                    <Check size={18} className="text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{stats.completedBookings}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Boost Revenue</span>
                    <DollarSign size={18} className="text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{formatCurrency(stats.boostRevenue)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}