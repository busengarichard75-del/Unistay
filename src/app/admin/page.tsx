"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, Search, Home, Calendar, DollarSign, Megaphone, Eye, EyeOff, Star,
  RefreshCw, LayoutGrid, Clock, CreditCard, Users, Landmark, Briefcase,
  Shield, AlertTriangle, MessageCircle, Building, CheckCircle, XCircle,
  BarChart3, Settings, Wrench, User as UserIcon, Mail, Ban, Trash2,
  TrendingUp, Smartphone, Monitor, Tablet, GraduationCap, UserX, ScrollText,
  Store, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import {
  getAllApprovedBookings,
  updateBookingStatus,
} from "@/services/bookingService";
import {
  getAnnouncement,
  updateAnnouncement,
} from "@/services/announcementService";
import {
  getAllProperties,
  updateProperty,
} from "@/services/propertyService";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { isBoosted, getBoostDaysRemaining } from "@/lib/boostService";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { createNotification } from "@/services/notificationService";
import {
  hideProperty,
  unhideProperty,
  bulkVerifyProperties,
  suspendUser,
  unsuspendUser,
  refundBoost,
  cancelBooking as cancelBookingAction,
  setSiteMode,
  getSiteMode,
  sendDirectMessage,
  SiteMode,
} from "@/services/adminActionsService";
import {
  getRecentAuditEntries,
  AuditEntry,
} from "@/services/auditLogService";
import {
  HidePropertyModal,
  RefundBoostModal,
  SuspendUserModal,
  CancelBookingModal,
  DirectMessageModal,
  SendEmailModal,
  SiteModeModal,
  ViewUserProfileModal,
  BulkVerifyModal,
  UserProfileData,
} from "@/components/admin/AdminModals";
import { getVisitStats, VisitStats, VisitorRole, DeviceType } from "@/services/analyticsService";

const AGENT_FEE = 100;
const BOOST_FEE = 100;
const ADMIN_PIN = "3542";

type AdminTab =
  | "dashboard" | "payments" | "properties" | "users" | "providers"
  | "bookings" | "comms" | "analytics" | "tools";

const TABS: { id: AdminTab; label: string; icon: typeof LayoutGrid; color: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, color: "text-blue-400" },
  { id: "payments", label: "Payments", icon: DollarSign, color: "text-green-400" },
  { id: "properties", label: "Properties", icon: Home, color: "text-cyan-400" },
  { id: "users", label: "Users", icon: Users, color: "text-purple-400" },
  { id: "providers", label: "Providers", icon: Store, color: "text-emerald-400" },
  { id: "bookings", label: "Bookings", icon: Calendar, color: "text-orange-400" },
  { id: "comms", label: "Comms", icon: Megaphone, color: "text-pink-400" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-yellow-400" },
  { id: "tools", label: "Tools", icon: Wrench, color: "text-red-400" },
];

interface UnansweredQuestion {
  id: string;
  message: string;
  userId: string | null;
  userEmail: string | null;
  createdAt: any;
  resolved: boolean;
}

interface DirectoryUser {
  uid: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: "student" | "landlord" | "service_provider";
  university?: string;
  studentNumber?: string;
  createdAt?: number;
  suspended?: boolean;
  suspendedReason?: string | null;

  businessName?: string;
  whatsapp?: string;
  providerType?: "service" | "product";
  verificationStatus?: "pending" | "approved" | "rejected";
  verificationReviewedAt?: number;
  verificationReviewedBy?: string;
  verificationReason?: string | null;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const [announceContent, setAnnounceContent] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isUpdatingAnnounce, setIsUpdatingAnnounce] = useState(false);
  const [loadingAnnounce, setLoadingAnnounce] = useState(true);
  const [sendPush, setSendPush] = useState(false);
  const [pushTarget, setPushTarget] = useState<"all" | "student" | "landlord">("all");

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [boostSearchTerm, setBoostSearchTerm] = useState("");
  const [isTogglingBoost, setIsTogglingBoost] = useState<string | null>(null);
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState<"all" | "pending" | "hidden">("all");

  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "landlord">("all");

  const [unansweredQuestions, setUnansweredQuestions] = useState<UnansweredQuestion[]>([]);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [isResolving, setIsResolving] = useState<string | null>(null);

  const [statsReset, setStatsReset] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [currentSiteMode, setCurrentSiteMode] = useState<SiteMode>("off");

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isFetchingAudit, setIsFetchingAudit] = useState(false);

  const [analytics, setAnalytics] = useState<VisitStats | null>(null);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<"24h" | "7d" | "30d" | "all">("7d");

  const [hideModal, setHideModal] = useState<{ id: string; title: string; ownerId: string } | null>(null);
  const [refundModal, setRefundModal] = useState<{ id: string; title: string } | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ uid: string; name: string; currentlySuspended: boolean } | null>(null);
  const [cancelBookingModal, setCancelBookingModal] = useState<Booking | null>(null);
  const [dmModal, setDmModal] = useState<{ uid: string; name: string } | null>(null);
  const [emailModal, setEmailModal] = useState<{ email: string; name: string } | null>(null);
  const [siteModeModal, setSiteModeModal] = useState(false);
  const [profileModal, setProfileModal] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [bulkModal, setBulkModal] = useState<{ status: "approved" | "rejected" } | null>(null);

  const [providerFilter, setProviderFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [busyProviderId, setBusyProviderId] = useState<string | null>(null);
  const [rejectProviderModal, setRejectProviderModal] = useState<DirectoryUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [stats, setStats] = useState({
    totalProperties: 0, totalBookings: 0, pendingPayments: 0, boostedListings: 0,
    totalStudents: 0, totalLandlords: 0, completedBookings: 0, boostRevenue: 0,
    agentFeeRevenue: 0, totalRevenue: 0, hiddenProperties: 0,
  });

  const adminCtx = useMemo(
    () => ({ adminId: user?.uid || "", adminEmail: user?.email || "" }),
    [user]
  );

  const fetchAllData = async () => {
    setIsFetching(true);
    setIsFetchingProperties(true);
    setIsFetchingUsers(true);
    setLoadingSettings(true);
    try {
      const bookingsData = await getAllApprovedBookings();
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);

      const allPropsRef = collection(db, "properties");
      const allPropsSnap = await getDocs(allPropsRef);
      const allProps = allPropsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Property));
      setAllProperties(allProps);

      const pendingQuery = query(allPropsRef, where("verificationStatus", "==", "pending"));
      const pendingSnap = await getDocs(pendingQuery);
      setPendingProperties(pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Property)));

      const usersRef = collection(db, "users");
      const [studentSnap, landlordSnap, allUsersSnap] = await Promise.all([
        getDocs(query(usersRef, where("role", "==", "student"))),
        getDocs(query(usersRef, where("role", "==", "landlord"))),
        getDocs(usersRef),
      ]);
      setDirectoryUsers(
        allUsersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as DirectoryUser))
      );

      const allBookingsRef = collection(db, "bookings");
      const allBookingsSnap = await getDocs(allBookingsRef);
      const allBookingsList = allBookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      setAllBookings(allBookingsList);

      const completedBookings = allBookingsList.filter((b) => b.status === "confirmed").length;
      const pendingPayments = allBookingsList.filter((b) => b.status === "approved").length;
      const boosted = allProps.filter((p) => isBoosted(p)).length;
      const hiddenProperties = allProps.filter((p) => p.adminHidden === true).length;
      const boostRevenue = boosted * BOOST_FEE;
      const agentFeeRevenue = completedBookings * AGENT_FEE;

      setStats({
        totalProperties: allProps.length,
        totalBookings: allBookingsList.length,
        pendingPayments,
        boostedListings: boosted,
        totalStudents: studentSnap.size,
        totalLandlords: landlordSnap.size,
        completedBookings,
        boostRevenue,
        agentFeeRevenue,
        totalRevenue: boostRevenue + agentFeeRevenue,
        hiddenProperties,
      });

      setError(null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load admin data. Please try again.");
    } finally {
      setIsFetching(false);
      setIsFetchingProperties(false);
      setIsFetchingUsers(false);
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
    } catch { /* silent */ } finally {
      setLoadingAnnounce(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "main"));
      if (snap.exists()) {
        const data = snap.data();
        setStatsReset(data.statsReset || false);
      }
      const mode = await getSiteMode();
      setCurrentSiteMode(mode.mode);
    } catch { /* silent */ } finally {
      setLoadingSettings(false);
    }
  };

  const fetchUnansweredQuestions = async () => {
    setIsFetchingQuestions(true);
    try {
      const q = query(collection(db, "unansweredQuestions"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setUnansweredQuestions(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UnansweredQuestion))
      );
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const fetchAudit = async () => {
    setIsFetchingAudit(true);
    try {
      const entries = await getRecentAuditEntries(200);
      setAuditEntries(entries);
    } finally {
      setIsFetchingAudit(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsFetchingAnalytics(true);
    const sinceMs =
      analyticsRange === "24h" ? Date.now() - 86400000 :
      analyticsRange === "7d" ? Date.now() - 7 * 86400000 :
      analyticsRange === "30d" ? Date.now() - 30 * 86400000 :
      0;
    try {
      const data = await getVisitStats(sinceMs);
      setAnalytics(data);
    } finally {
      setIsFetchingAnalytics(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAdminEmail(user?.email)) { router.push("/"); return; }
    if (isPinVerified) {
      fetchAllData();
      fetchAnnounce();
      fetchSettings();
      fetchUnansweredQuestions();
      fetchAudit();
      fetchAnalytics();
    }
  }, [user, isLoading, router, isPinVerified, analyticsRange]);

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredBookings(bookings); return; }
    const q = searchTerm.toLowerCase().trim();
    setFilteredBookings(
      bookings.filter(
        (b) =>
          b.studentName.toLowerCase().includes(q) ||
          b.propertyTitle.toLowerCase().includes(q) ||
          b.studentId.toLowerCase().includes(q)
      )
    );
  }, [searchTerm, bookings]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) { setIsPinVerified(true); setPinError(""); }
    else { setPinError("Incorrect PIN. Try again."); setPin(""); }
  };

  async function handleMarkPaid(bookingId: string) {
    setIsSubmitting(bookingId);
    try {
      await updateBookingStatus(bookingId, { status: "confirmed", confirmedAt: Date.now() });
      const updated = bookings.filter((b) => b.id !== bookingId);
      setBookings(updated);
      setFilteredBookings(updated);
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        await createNotification(booking.studentId, {
          title: "Booking Confirmed 🎉",
          body: `Your booking at "${booking.propertyTitle}" has been confirmed.`,
          type: "booking_confirmed",
          link: "/dashboard/student",
        });
        await createNotification(booking.landlordId, {
          title: "Booking Confirmed 🎉",
          body: `${booking.studentName}'s booking at "${booking.propertyTitle}" has been confirmed.`,
          type: "booking_confirmed",
          link: "/dashboard/landlord",
        });
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id, type: "booking_confirmed" }),
        }).catch(() => {});
      }
      toast.success("Payment confirmed!");
    } catch {
      toast.error("Failed to mark as paid.");
    } finally {
      setIsSubmitting(null);
    }
  }

  const handlePublishAnnounce = async () => {
    if (!announceContent.trim()) { toast.error("Please write a message."); return; }
    setIsUpdatingAnnounce(true);
    try {
      await updateAnnouncement({ content: announceContent.trim(), isActive: true });
      setIsActive(true);
      toast.success("Announcement published!");
      if (sendPush) {
        const res = await fetch("/api/admin/announce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "📢 New Announcement",
            body: announceContent.trim(),
            targetRole: pushTarget === "all" ? undefined : pushTarget,
          }),
        });
        const data = await res.json();
        if (res.ok) toast.success(`Push sent to ${data.sent} users!`);
        else toast.error("Push failed: " + data.error);
      }
    } catch {
      toast.error("Failed to publish.");
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
    } catch { toast.error("Failed."); } finally {
      setIsUpdatingAnnounce(false);
    }
  };

  const handleToggleBoost = async (property: Property) => {
    setIsTogglingBoost(property.id);
    try {
      const newBoosted = !isBoosted(property);
      const updateData: any = {
        isBoosted: newBoosted,
        boostedAt: newBoosted ? Date.now() : null,
        boostExpiry: newBoosted ? Date.now() + 30 * 86400000 : null,
      };
      await updateProperty(property.id, updateData);
      setAllProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, ...updateData } : p))
      );
      toast.success(`Property ${newBoosted ? "boosted" : "unboosted"}!`);
    } catch { toast.error("Failed to update boost."); } finally {
      setIsTogglingBoost(null);
    }
  };

  const handleVerifyProperty = async (
    property: Property,
    status: "approved" | "rejected"
  ) => {
    setIsVerifying(property.id);
    try {
      await updateProperty(property.id, { verificationStatus: status });
      setPendingProperties((prev) => prev.filter((p) => p.id !== property.id));
      setAllProperties((prev) =>
        prev.map((p) =>
          p.id === property.id ? { ...p, verificationStatus: status } : p
        )
      );

      const isApproved = status === "approved";
      const notifTitle = isApproved
        ? "Your listing is live! 🎉"
        : "Listing needs changes";
      const notifBody = isApproved
        ? `"${property.title}" has been approved and is now visible to students.`
        : `"${property.title}" wasn't approved. Please update it and re-submit.`;

      try {
        await createNotification(property.ownerId, {
          title: notifTitle,
          body: notifBody,
          type: "announcement",
          link: "/dashboard/landlord",
        });
        await sendPushNotification({
          userId: property.ownerId,
          title: notifTitle,
          body: notifBody,
          url: "/dashboard/landlord",
        });
      } catch {
        // silent
      }

      toast.success(`Property ${status}!`);
    } catch {
      toast.error("Failed.");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleResetStats = async () => {
    if (!window.confirm("Reset stats? Numbers hidden, no data deleted.")) return;
    try {
      await setDoc(doc(db, "settings", "main"), { statsReset: true }, { merge: true });
      setStatsReset(true);
      toast.success("Stats reset.");
    } catch { toast.error("Failed."); }
  };

  const handleShowStats = async () => {
    try {
      await setDoc(doc(db, "settings", "main"), { statsReset: false }, { merge: true });
      setStatsReset(false);
      toast.success("Stats restored.");
    } catch { toast.error("Failed."); }
  };

  const handleMarkResolved = async (questionId: string) => {
    setIsResolving(questionId);
    try {
      await updateDoc(doc(db, "unansweredQuestions", questionId), { resolved: true });
      setUnansweredQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, resolved: true } : q))
      );
      toast.success("Resolved.");
    } catch { toast.error("Failed."); } finally {
      setIsResolving(null);
    }
  };

  const confirmHide = async (reason: string) => {
    if (!hideModal) return;
    await hideProperty(adminCtx, hideModal.id, hideModal.title, hideModal.ownerId, reason);
    setAllProperties((prev) =>
      prev.map((p) =>
        p.id === hideModal.id
          ? { ...p, adminHidden: true, adminHiddenReason: reason, adminHiddenAt: Date.now() }
          : p
      )
    );
    setStats((s) => ({ ...s, hiddenProperties: s.hiddenProperties + 1 }));
    toast.success("Property hidden.");
    setHideModal(null);
    fetchAudit();
  };

  const handleUnhide = async (p: Property) => {
    await unhideProperty(adminCtx, p.id, p.title, p.ownerId);
    setAllProperties((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, adminHidden: false, adminHiddenReason: undefined } : x))
    );
    setStats((s) => ({ ...s, hiddenProperties: Math.max(0, s.hiddenProperties - 1) }));
    toast.success("Property restored.");
    fetchAudit();
  };

  const toggleSelectProp = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulk = async () => {
    if (!bulkModal) return;
    const count = await bulkVerifyProperties(adminCtx, selectedPropertyIds, bulkModal.status);
    setPendingProperties((prev) => prev.filter((p) => !selectedPropertyIds.includes(p.id)));
    setAllProperties((prev) =>
      prev.map((p) =>
        selectedPropertyIds.includes(p.id) ? { ...p, verificationStatus: bulkModal.status } : p
      )
    );
    toast.success(`${count} properties ${bulkModal.status}.`);
    setSelectedPropertyIds([]);
    setBulkModal(null);
    fetchAudit();
  };

  const confirmRefund = async () => {
    if (!refundModal) return;
    await refundBoost(adminCtx, refundModal.id, refundModal.title);
    setAllProperties((prev) =>
      prev.map((p) =>
        p.id === refundModal.id ? { ...p, isBoosted: false, boostExpiry: undefined } : p
      )
    );
    toast.success("Boost refunded.");
    setRefundModal(null);
    fetchAudit();
  };

  const confirmSuspend = async (reason: string) => {
    if (!suspendModal) return;
    if (suspendModal.currentlySuspended) {
      await unsuspendUser(adminCtx, suspendModal.uid, suspendModal.name);
      setDirectoryUsers((prev) =>
        prev.map((u) => (u.uid === suspendModal.uid ? { ...u, suspended: false, suspendedReason: undefined } : u))
      );
      toast.success("User unsuspended.");
    } else {
      await suspendUser(adminCtx, suspendModal.uid, suspendModal.name, reason);
      setDirectoryUsers((prev) =>
        prev.map((u) =>
          u.uid === suspendModal.uid ? { ...u, suspended: true, suspendedReason: reason } : u
        )
      );
      toast.success("User suspended.");
    }
    setSuspendModal(null);
    setProfileModal(null);
    fetchAudit();
  };

  const openUserProfile = async (u: DirectoryUser) => {
    setProfileLoading(true);
    setProfileModal({
      uid: u.uid, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role,
      university: u.university, studentNumber: u.studentNumber, createdAt: u.createdAt,
      suspended: u.suspended, suspendedReason: u.suspendedReason,
      listings: [], bookings: [],
    });

    try {
      const listings = allProperties
        .filter((p) => p.ownerId === u.uid)
        .map((p) => ({ id: p.id, title: p.title, price: p.price, location: p.location }));

      const relatedBookings = allBookings.filter((b) =>
        u.role === "landlord" ? b.landlordId === u.uid : b.studentId === u.uid
      ).map((b) => ({
        id: b.id,
        propertyTitle: b.propertyTitle,
        studentName: b.studentName,
        price: b.price,
        status: b.status,
        createdAt: b.createdAt,
      }));

      setProfileModal((prev) =>
        prev ? { ...prev, listings, bookings: relatedBookings.slice(0, 20) } : prev
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const confirmDirectMessage = async (title: string, body: string) => {
    if (!dmModal) return;
    await sendDirectMessage(adminCtx, dmModal.uid, dmModal.name, title, body);
    toast.success("Message sent!");
    setDmModal(null);
    fetchAudit();
  };

  const confirmEmail = async (subject: string, message: string) => {
    if (!emailModal) return;
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: adminCtx.adminEmail,
          to: emailModal.email,
          subject,
          message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email sent!");
        setEmailModal(null);
        fetchAudit();
      } else {
        toast.error("Failed: " + data.error);
      }
    } catch {
      toast.error("Failed to send email.");
    }
  };

  const confirmCancelBooking = async (reason: string) => {
    if (!cancelBookingModal) return;
    const b = cancelBookingModal;
    await cancelBookingAction(adminCtx, b.id, b.propertyTitle, b.studentId, b.landlordId, reason);
    setAllBookings((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, status: "rejected" as any } : x))
    );
    toast.success("Booking cancelled.");
    setCancelBookingModal(null);
    fetchAudit();
  };

  const confirmSiteMode = async (mode: SiteMode, message: string) => {
    await setSiteMode(adminCtx, mode, message);
    setCurrentSiteMode(mode);
    toast.success(`Site mode: ${mode === "off" ? "Normal" : "Read-only"}`);
    setSiteModeModal(false);
    fetchAudit();
  };

  // ─── Provider verification handlers ───
  const handleApproveProvider = async (provider: DirectoryUser) => {
    setBusyProviderId(provider.uid);
    try {
      await updateDoc(doc(db, "users", provider.uid), {
        verificationStatus: "approved",
        verificationReason: null,
        verificationReviewedAt: Date.now(),
        verificationReviewedBy: adminCtx.adminEmail,
      });
      setDirectoryUsers((prev) =>
        prev.map((u) =>
          u.uid === provider.uid
            ? {
                ...u,
                verificationStatus: "approved",
                verificationReason: null,
                verificationReviewedAt: Date.now(),
                verificationReviewedBy: adminCtx.adminEmail,
              }
            : u
        )
      );

      // ─── Notify provider ───
      try {
        await createNotification(provider.uid, {
          title: "You're verified! 🎉",
          body: "Your Peza provider account has been approved. You can now start adding listings.",
          type: "announcement",
          link: "/dashboard/provider",
        });
        await sendPushNotification({
          userId: provider.uid,
          title: "You're verified! 🎉",
          body: "Your Peza provider account has been approved. You can now start adding listings.",
          url: "/dashboard/provider",
        });
      } catch {
        // silent — notification is best-effort
      }

      toast.success(
        `Approved ${provider.businessName || provider.fullName || provider.email}`
      );
      fetchAudit();
    } catch {
      toast.error("Failed to approve provider.");
    } finally {
      setBusyProviderId(null);
    }
  };

  const handleRejectProvider = async () => {
    if (!rejectProviderModal) return;
    if (!rejectReason.trim()) {
      toast.error("Please write a reason.");
      return;
    }
    setBusyProviderId(rejectProviderModal.uid);
    try {
      await updateDoc(doc(db, "users", rejectProviderModal.uid), {
        verificationStatus: "rejected",
        verificationReason: rejectReason.trim(),
        verificationReviewedAt: Date.now(),
        verificationReviewedBy: adminCtx.adminEmail,
      });
      setDirectoryUsers((prev) =>
        prev.map((u) =>
          u.uid === rejectProviderModal.uid
            ? {
                ...u,
                verificationStatus: "rejected",
                verificationReason: rejectReason.trim(),
                verificationReviewedAt: Date.now(),
                verificationReviewedBy: adminCtx.adminEmail,
              }
            : u
        )
      );

      // ─── Notify provider ───
      try {
        await createNotification(rejectProviderModal.uid, {
          title: "Account update",
          body: `Your provider account wasn't approved. Reason: ${rejectReason.trim()}. Contact support for help.`,
          type: "announcement",
          link: "/dashboard/provider",
        });
        await sendPushNotification({
          userId: rejectProviderModal.uid,
          title: "Account update",
          body: `Your provider account wasn't approved. Contact support for help.`,
          url: "/dashboard/provider",
        });
      } catch {
        // silent — notification is best-effort
      }

      toast.success("Provider rejected.");
      setRejectProviderModal(null);
      setRejectReason("");
      fetchAudit();
    } catch {
      toast.error("Failed to reject provider.");
    } finally {
      setBusyProviderId(null);
    }
  };

  const filteredPropertiesForBoost = allProperties.filter((p) => {
    const s = boostSearchTerm.toLowerCase();
    const matchesSearch =
      !s || p.title.toLowerCase().includes(s) || p.location.toLowerCase().includes(s);
    if (!matchesSearch) return false;
    if (showHiddenOnly || propertyFilter === "hidden") return p.adminHidden === true;
    return true;
  });

  const filteredQuestions = showResolved
    ? unansweredQuestions
    : unansweredQuestions.filter((q) => !q.resolved);

  const filteredUsers = directoryUsers.filter((u) => {
    const s = userSearchTerm.toLowerCase();
    const matchesSearch =
      !s ||
      (u.fullName || "").toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.phone || "").includes(s);
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const providerList = directoryUsers.filter((u) => u.role === "service_provider");
  const providerCounts = {
    pending: providerList.filter((p) => (p.verificationStatus || "pending") === "pending").length,
    approved: providerList.filter((p) => p.verificationStatus === "approved").length,
    rejected: providerList.filter((p) => p.verificationStatus === "rejected").length,
  };
  const filteredProviders = providerList
    .filter((p) => (p.verificationStatus || "pending") === providerFilter)
    .filter((p) => {
      const s = providerSearchTerm.toLowerCase().trim();
      if (!s) return true;
      return (
        (p.fullName || "").toLowerCase().includes(s) ||
        (p.businessName || "").toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s)
      );
    });

  const formatCurrency = (n: number) => `K${n.toLocaleString()}`;

  if (isLoading || loadingSettings) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 rounded bg-gray-700" />
      </div>
    );
  }

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
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-center text-2xl text-white placeholder-gray-500 outline-none focus:border-blue-500"
                placeholder="••••"
                autoFocus
              />
              {pinError && <p className="mt-2 text-sm text-red-400">{pinError}</p>}
            </div>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <div className="sticky top-0 z-30 border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg text-sm">🚀</span>
                Peza Admin Studio
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {currentSiteMode === "readonly" && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-900/40 px-2 py-1 rounded-full border border-amber-800">
                  READ-ONLY MODE
                </span>
              )}
              <button
                onClick={() => { fetchAllData(); fetchAudit(); fetchAnalytics(); }}
                className="rounded-lg bg-gray-800 p-2 text-gray-300 hover:bg-gray-700"
                title="Refresh"
              >
                <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
              </button>
              <Link href="/" className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-700">
                View Site
              </Link>
              <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">v3.0</span>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                    active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={14} className={active ? "text-white" : tab.color} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 rounded-xl bg-red-900/30 border border-red-800 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <KpiCard label="Properties" value={stats.totalProperties} icon={LayoutGrid} color="text-cyan-400" onClick={() => setActiveTab("properties")} />
              <KpiCard label="Bookings" value={stats.totalBookings} icon={Calendar} color="text-purple-400" onClick={() => setActiveTab("bookings")} />
              <KpiCard label="Pending" value={stats.pendingPayments} icon={CreditCard} color="text-yellow-400" onClick={() => setActiveTab("payments")} />
              <KpiCard label="Hidden" value={stats.hiddenProperties} icon={EyeOff} color="text-red-400" onClick={() => { setActiveTab("properties"); setPropertyFilter("hidden"); }} />
              <KpiCard label="Students" value={stats.totalStudents} icon={Users} color="text-green-400" onClick={() => { setActiveTab("users"); setUserRoleFilter("student"); }} />
              <KpiCard label="Landlords" value={stats.totalLandlords} icon={Briefcase} color="text-orange-400" onClick={() => { setActiveTab("users"); setUserRoleFilter("landlord"); }} />
              <KpiCard label="Confirmed" value={stats.completedBookings} icon={Check} color="text-emerald-400" onClick={() => setActiveTab("bookings")} />
              <KpiCard label="Boosted" value={stats.boostedListings} icon={Star} color="text-yellow-400" onClick={() => setActiveTab("properties")} />
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Landmark size={22} className="text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Revenue Tracker</h3>
                </div>
                {statsReset ? (
                  <button onClick={handleShowStats} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Show Stats</button>
                ) : (
                  <button onClick={handleResetStats} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Reset</button>
                )}
              </div>
              {statsReset ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm">Stats hidden.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <p className="text-sm text-gray-400">Agent Fees</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.agentFeeRevenue)}</p>
                    <p className="text-xs text-gray-500">{stats.completedBookings} × K{AGENT_FEE}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <p className="text-sm text-gray-400">Boost Revenue</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.boostRevenue)}</p>
                    <p className="text-xs text-gray-500">{stats.boostedListings} × K{BOOST_FEE}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 rounded-lg p-4 border border-blue-700/50">
                    <p className="text-sm text-gray-300">Total</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickAction label={`Payments (${stats.pendingPayments})`} icon={DollarSign} onClick={() => setActiveTab("payments")} />
                <QuickAction label={`Providers (${providerCounts.pending})`} icon={Store} onClick={() => { setActiveTab("providers"); setProviderFilter("pending"); }} />
                <QuickAction label="Announce" icon={Megaphone} onClick={() => setActiveTab("comms")} />
                <QuickAction label="Analytics" icon={BarChart3} onClick={() => setActiveTab("analytics")} />
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ScrollText size={16} className="text-blue-400" /> Recent admin activity
                </h3>
                <button onClick={() => setActiveTab("tools")} className="text-xs text-gray-400 hover:text-white">View all →</button>
              </div>
              {auditEntries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {auditEntries.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-gray-800/40 p-2.5">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-200 truncate">
                          <span className="font-medium">{e.action.replace(/_/g, " ")}</span>
                          {e.targetLabel && <span className="text-gray-500"> · {e.targetLabel}</span>}
                        </p>
                        <p className="text-[10px] text-gray-500">{new Date(e.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
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
                  placeholder="Search..."
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
                />
              </div>

              {isFetching ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-800 rounded-lg" />
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Check size={40} className="mx-auto text-green-500" strokeWidth={1.5} />
                  <p className="text-sm text-gray-300 mt-2">All caught up! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="flex flex-wrap items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{booking.studentName}</p>
                        <p className="text-xs text-gray-400">{booking.propertyTitle} • K{booking.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleMarkPaid(booking.id)}
                        disabled={isSubmitting === booking.id}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSubmitting === booking.id ? "..." : <><Check size={16} /> Confirm</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Boost Refunds</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Refund a K100 boost and remove it from a property. Send the money back via mobile money manually.
              </p>
              {allProperties.filter((p) => isBoosted(p)).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active boosts.</p>
              ) : (
                <div className="space-y-2">
                  {allProperties.filter((p) => isBoosted(p)).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.location}</p>
                      </div>
                      <button
                        onClick={() => setRefundModal({ id: p.id, title: p.title })}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        Refund K100
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "properties" && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {(["all", "pending", "hidden"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setPropertyFilter(f); setShowHiddenOnly(f === "hidden"); }}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    propertyFilter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {f === "all" ? `All (${allProperties.length})` : f === "pending" ? `Pending (${pendingProperties.length})` : `Hidden (${stats.hiddenProperties})`}
                </button>
              ))}
            </div>

            {(propertyFilter === "pending" || propertyFilter === "all") && pendingProperties.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">Pending Verifications</h2>
                    <span className="text-xs text-gray-400">({pendingProperties.length})</span>
                  </div>
                  {selectedPropertyIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{selectedPropertyIds.length} selected</span>
                      <button
                        onClick={() => setBulkModal({ status: "rejected" })}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Reject all
                      </button>
                      <button
                        onClick={() => setBulkModal({ status: "approved" })}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Approve all
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {pendingProperties.map((property) => {
                    const selected = selectedPropertyIds.includes(property.id);
                    return (
                      <div
                        key={property.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          selected ? "bg-blue-900/20 border-blue-700" : "bg-gray-800/50 border-yellow-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectProp(property.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{property.title}</p>
                          <p className="text-xs text-gray-400">{property.location}</p>
                          <p className="text-xs text-gray-500 mt-1">Owner: {property.ownerId} · K{property.price}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleVerifyProperty(property, "rejected")}
                            disabled={isVerifying === property.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleVerifyProperty(property, "approved")}
                            disabled={isVerifying === property.id}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() =>
                      setSelectedPropertyIds(
                        selectedPropertyIds.length === pendingProperties.length
                          ? []
                          : pendingProperties.map((p) => p.id)
                      )
                    }
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {selectedPropertyIds.length === pendingProperties.length ? "Deselect all" : "Select all"}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home size={20} className="text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  {propertyFilter === "hidden" ? "Hidden Properties" : "All Properties"}
                </h2>
              </div>

              <div className="mb-4 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={boostSearchTerm}
                  onChange={(e) => setBoostSearchTerm(e.target.value)}
                  placeholder="Search properties..."
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
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
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {filteredPropertiesForBoost.map((property) => {
                    const boosted = isBoosted(property);
                    const daysLeft = boosted ? getBoostDaysRemaining(property) : 0;
                    const hidden = property.adminHidden === true;
                    return (
                      <div
                        key={property.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          hidden ? "bg-red-900/10 border-red-900/50" : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {property.title}
                              {hidden && (
                                <span className="ml-2 text-[10px] font-semibold text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full">
                                  HIDDEN
                                </span>
                              )}
                              {boosted && (
                                <span className="ml-2 text-[10px] text-yellow-400 inline-flex items-center gap-1">
                                  <Star size={10} fill="currentColor" /> {daysLeft}d
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {property.location} · K{property.price.toLocaleString()}
                            </p>
                            {hidden && property.adminHiddenReason && (
                              <p className="text-[10px] text-red-400 mt-1">
                                Reason: {property.adminHiddenReason}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleBoost(property)}
                              disabled={isTogglingBoost === property.id}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                boosted
                                  ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              }`}
                            >
                              {isTogglingBoost === property.id ? "..." : boosted ? "Unboost" : "Boost"}
                            </button>
                            {hidden ? (
                              <button
                                onClick={() => handleUnhide(property)}
                                className="rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-green-700"
                              >
                                Unhide
                              </button>
                            ) : (
                              <button
                                onClick={() => setHideModal({ id: property.id, title: property.title, ownerId: property.ownerId })}
                                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
                              >
                                Hide
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                <h2 className="text-lg font-semibold text-white">User Directory</h2>
                <span className="text-xs text-gray-400">({filteredUsers.length})</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
                />
              </div>
              {(["all", "student", "landlord"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                    userRoleFilter === r ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            {isFetchingUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-14 bg-gray-800 rounded-lg" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No users found.</p>
            ) : (
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      u.suspended ? "bg-red-900/10 border-red-900/50" : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {u.fullName || u.email}
                        {u.suspended && (
                          <span className="ml-2 text-[10px] font-semibold text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full">
                            SUSPENDED
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {u.email} · {u.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => openUserProfile(u)}
                        className="rounded-lg bg-gray-700 px-3 py-1.5 text-[11px] font-medium text-gray-200 hover:bg-gray-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setDmModal({ uid: u.uid, name: u.fullName || u.email })}
                        className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                        title="Message"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        onClick={() => setEmailModal({ email: u.email, name: u.fullName || u.email })}
                        className="rounded-lg bg-purple-600 p-1.5 text-white hover:bg-purple-700"
                        title="Email"
                      >
                        <Mail size={14} />
                      </button>
                      <button
                        onClick={() => setSuspendModal({ uid: u.uid, name: u.fullName || u.email, currentlySuspended: !!u.suspended })}
                        className={`rounded-lg p-1.5 text-white ${
                          u.suspended ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                        }`}
                        title={u.suspended ? "Unsuspend" : "Suspend"}
                      >
                        <Ban size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "providers" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {(["pending", "approved", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setProviderFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    providerFilter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({providerCounts[f]})
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={providerSearchTerm}
                onChange={(e) => setProviderSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
              />
            </div>

            {isFetchingUsers ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-24 rounded-xl bg-gray-800" />
                ))}
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
                <Store size={32} className="mx-auto text-gray-700" />
                <p className="mt-2 text-sm text-gray-400">
                  {providerSearchTerm
                    ? "No providers match your search."
                    : `No ${providerFilter} providers.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProviders.map((p) => {
                  const isService = p.providerType !== "product";
                  const Icon = isService ? Wrench : ShoppingBag;
                  const typeLabel = isService ? "Service" : "Product";
                  const status = p.verificationStatus || "pending";
                  const busy = busyProviderId === p.uid;
                  const displayName = p.businessName || p.fullName || p.email;

                  return (
                    <div
                      key={p.uid}
                      className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                            isService
                              ? "bg-gradient-to-br from-cyan-500 to-teal-600"
                              : "bg-gradient-to-br from-orange-500 to-pink-600"
                          }`}
                        >
                          <Icon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {displayName}
                            </p>
                            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                              {typeLabel}
                            </span>
                            {status === "approved" && (
                              <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-[10px] font-medium text-green-300">
                                Approved
                              </span>
                            )}
                            {status === "rejected" && (
                              <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] font-medium text-red-300">
                                Rejected
                              </span>
                            )}
                            {status === "pending" && (
                              <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                                Pending
                              </span>
                            )}
                          </div>

                          <div className="mt-1 space-y-0.5 text-xs text-gray-400">
                            <p>{p.email}</p>
                            {p.whatsapp && <p>📱 {p.whatsapp}</p>}
                            {p.university && <p>🎓 {p.university}</p>}
                          </div>

                          {status === "rejected" && p.verificationReason && (
                            <p className="mt-2 text-[11px] italic text-red-400/80">
                              Reason: {p.verificationReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {status !== "approved" && (
                        <div className="mt-3 flex gap-2 border-t border-gray-800 pt-3">
                          <button
                            onClick={() => {
                              setRejectProviderModal(p);
                              setRejectReason("");
                            }}
                            disabled={busy}
                            className="flex-1 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/40 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveProvider(p)}
                            disabled={busy}
                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {busy ? "..." : "Approve"}
                          </button>
                        </div>
                      )}

                      {status === "approved" && (
                        <div className="mt-3 flex gap-2 border-t border-gray-800 pt-3">
                          <button
                            onClick={() => {
                              setRejectProviderModal(p);
                              setRejectReason("");
                            }}
                            disabled={busy}
                            className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-900/40 disabled:opacity-50"
                          >
                            Revoke approval
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-orange-400" />
                <h2 className="text-lg font-semibold text-white">All Bookings</h2>
                <span className="text-xs text-gray-400">({allBookings.length})</span>
              </div>
            </div>

            {allBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No bookings yet.</p>
            ) : (
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
                {allBookings.map((b) => (
                  <div key={b.id} className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{b.propertyTitle}</p>
                        <p className="text-xs text-gray-400">
                          {b.studentName} · K{b.price.toLocaleString()}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <BookingStatusPill status={b.status} />
                          <span className="text-[10px] text-gray-500">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {b.status !== "confirmed" && b.status !== "rejected" && b.status !== "expired" && (
                        <button
                          onClick={() => setCancelBookingModal(b)}
                          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "comms" && (
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone size={20} className="text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Announcements</h2>
                {!loadingAnnounce && (
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    isActive ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-gray-800 text-gray-400 border border-gray-700"
                  }`}>
                    {isActive ? <><Eye size={12} /> Active</> : <><EyeOff size={12} /> Hidden</>}
                  </span>
                )}
              </div>

              <textarea
                value={announceContent}
                onChange={(e) => setAnnounceContent(e.target.value)}
                placeholder="Write your announcement..."
                rows={3}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
              />

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={sendPush}
                      onChange={(e) => setSendPush(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600"
                    />
                    Push notification
                  </label>
                  {sendPush && (
                    <select
                      value={pushTarget}
                      onChange={(e) => setPushTarget(e.target.value as any)}
                      className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white outline-none"
                    >
                      <option value="all">All Users</option>
                      <option value="student">Students Only</option>
                      <option value="landlord">Landlords Only</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handlePublishAnnounce}
                    disabled={isUpdatingAnnounce}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-700"
                  >
                    <Megaphone size={16} />
                    {isUpdatingAnnounce ? "Publishing..." : "Publish"}
                  </button>
                  <button
                    onClick={handleHideAnnounce}
                    disabled={isUpdatingAnnounce || !isActive}
                    className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    <EyeOff size={16} /> Hide
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Student Questions</h2>
                  <span className="text-xs text-gray-400">({unansweredQuestions.filter((q) => !q.resolved).length})</span>
                </div>
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {showResolved ? "Hide resolved" : "Show resolved"}
                </button>
              </div>

              {isFetchingQuestions ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-800 rounded-lg" />
                  ))}
                </div>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No unanswered questions.</p>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((q) => (
                    <div
                      key={q.id}
                      className={`rounded-lg p-4 border ${
                        q.resolved ? "bg-gray-800/30 border-gray-700 opacity-60" : "bg-gray-800/50 border-yellow-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white break-words">{q.message}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span>{q.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}</span>
                            {q.userEmail && <span>👤 {q.userEmail}</span>}
                          </div>
                        </div>
                        {!q.resolved && (
                          <button
                            onClick={() => handleMarkResolved(q.id)}
                            disabled={isResolving === q.id}
                            className="ml-2 shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {isResolving === q.id ? "..." : "Resolve"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {(["24h", "7d", "30d", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAnalyticsRange(r)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    analyticsRange === r ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {r === "24h" ? "Last 24h" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
                </button>
              ))}
            </div>

            {isFetchingAnalytics ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-24 bg-gray-900/50 rounded-xl border border-gray-800" />
                ))}
              </div>
            ) : !analytics || analytics.totalVisits === 0 ? (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
                <Eye size={40} className="mx-auto text-gray-700 mb-3" />
                <p className="text-sm text-gray-400">No visits yet in this range.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnalyticsCard label="Total visits" value={analytics.totalVisits.toLocaleString()} icon={Eye} color="text-blue-400" />
                  <AnalyticsCard label="Unique visitors" value={analytics.uniqueVisitors.toLocaleString()} icon={Users} color="text-green-400" />
                  <AnalyticsCard label="Students" value={analytics.byRole.student.toLocaleString()} icon={GraduationCap} color="text-blue-400" />
                  <AnalyticsCard label="Guests" value={analytics.byRole.guest.toLocaleString()} icon={UserX} color="text-gray-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Users size={16} className="text-blue-400" /> By role
                    </h3>
                    {(["student", "landlord", "guest"] as VisitorRole[]).map((r) => {
                      const count = analytics.byRole[r] || 0;
                      const pct = analytics.totalVisits > 0 ? (count / analytics.totalVisits) * 100 : 0;
                      return (
                        <div key={r} className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-300 capitalize">{r}</span>
                            <span className="text-xs text-gray-400">{count} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${r === "student" ? "bg-blue-500" : r === "landlord" ? "bg-green-500" : "bg-gray-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Smartphone size={16} className="text-purple-400" /> By device
                    </h3>
                    {(["mobile", "tablet", "desktop"] as DeviceType[]).map((d) => {
                      const count = analytics.byDevice[d] || 0;
                      const pct = analytics.totalVisits > 0 ? (count / analytics.totalVisits) * 100 : 0;
                      const Icon = d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;
                      return (
                        <div key={d} className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-300 flex items-center gap-1">
                              <Icon size={11} /> {d}
                            </span>
                            <span className="text-xs text-gray-400">{count} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-amber-400" /> Top pages
                  </h3>
                  {analytics.topPages.map((p, i) => (
                    <div key={i} className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-300 font-mono truncate">{p.path}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-red-400" />
                  <h2 className="text-lg font-semibold text-white">Global Site Mode</h2>
                </div>
                <button
                  onClick={() => setSiteModeModal(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Change Mode
                </button>
              </div>
              <div className={`rounded-lg border p-4 ${
                currentSiteMode === "readonly"
                  ? "bg-amber-900/20 border-amber-800/50"
                  : "bg-green-900/20 border-green-800/50"
              }`}>
                <p className="text-sm font-medium text-white">
                  {currentSiteMode === "readonly" ? "🟡 Read-only mode active" : "🟢 Site online — normal operation"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {currentSiteMode === "readonly"
                    ? "Students can browse but can't book. A banner shows site-wide."
                    : "All functionality is available to users."}
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ScrollText size={20} className="text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Audit Log</h2>
                  <span className="text-xs text-gray-400">({auditEntries.length})</span>
                </div>
                <button
                  onClick={fetchAudit}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {isFetchingAudit ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-12 bg-gray-800 rounded-lg" />
                  ))}
                </div>
              ) : auditEntries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No admin actions logged yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2">
                  {auditEntries.map((e) => (
                    <div key={e.id} className="flex items-start justify-between rounded-lg bg-gray-800/40 border border-gray-800 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white">
                          <span className="font-medium">{e.action.replace(/_/g, " ")}</span>
                          {e.targetLabel && <span className="text-gray-500"> · {e.targetLabel}</span>}
                        </p>
                        {e.details && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{e.details}</p>}
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {e.adminEmail} · {new Date(e.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-red-900/10 rounded-xl border border-red-900/50 p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-red-400" />
                <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
              </div>
              <p className="text-sm text-red-200/70">
                Careful actions. These can affect many users.
              </p>
            </div>
          </div>
        )}
      </div>

      {hideModal && (
        <HidePropertyModal
          propertyTitle={hideModal.title}
          onClose={() => setHideModal(null)}
          onConfirm={confirmHide}
        />
      )}

      {refundModal && (
        <RefundBoostModal
          propertyTitle={refundModal.title}
          onClose={() => setRefundModal(null)}
          onConfirm={confirmRefund}
        />
      )}

      {suspendModal && (
        <SuspendUserModal
          userName={suspendModal.name}
          onClose={() => setSuspendModal(null)}
          onConfirm={confirmSuspend}
        />
      )}

      {cancelBookingModal && (
        <CancelBookingModal
          bookingLabel={`${cancelBookingModal.propertyTitle} — ${cancelBookingModal.studentName}`}
          onClose={() => setCancelBookingModal(null)}
          onConfirm={confirmCancelBooking}
        />
      )}

      {dmModal && (
        <DirectMessageModal
          userName={dmModal.name}
          onClose={() => setDmModal(null)}
          onConfirm={confirmDirectMessage}
        />
      )}

      {emailModal && (
        <SendEmailModal
          toEmail={emailModal.email}
          onClose={() => setEmailModal(null)}
          onConfirm={confirmEmail}
        />
      )}

      {siteModeModal && (
        <SiteModeModal
          currentMode={currentSiteMode}
          onClose={() => setSiteModeModal(false)}
          onConfirm={confirmSiteMode}
        />
      )}

      {profileModal && (
        <ViewUserProfileModal
          profile={profileModal}
          loading={profileLoading}
          onClose={() => setProfileModal(null)}
          onDirectMessage={() =>
            setDmModal({ uid: profileModal.uid, name: profileModal.fullName || profileModal.email })
          }
          onSendEmail={() =>
            setEmailModal({ email: profileModal.email, name: profileModal.fullName || profileModal.email })
          }
          onToggleSuspend={() =>
            setSuspendModal({
              uid: profileModal.uid,
              name: profileModal.fullName || profileModal.email,
              currentlySuspended: !!profileModal.suspended,
            })
          }
        />
      )}

      {bulkModal && (
        <BulkVerifyModal
          count={selectedPropertyIds.length}
          status={bulkModal.status}
          onClose={() => setBulkModal(null)}
          onConfirm={confirmBulk}
        />
      )}

      {rejectProviderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => {
            if (busyProviderId) return;
            setRejectProviderModal(null);
            setRejectReason("");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">
              {rejectProviderModal.verificationStatus === "approved"
                ? "Revoke approval?"
                : "Reject provider?"}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {rejectProviderModal.businessName ||
                rejectProviderModal.fullName ||
                rejectProviderModal.email}
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Reason (shown to the provider)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g., Could not verify business details. Please contact support."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setRejectProviderModal(null);
                  setRejectReason("");
                }}
                disabled={!!busyProviderId}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProvider}
                disabled={!!busyProviderId || !rejectReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {busyProviderId
                  ? "Processing..."
                  : rejectProviderModal.verificationStatus === "approved"
                  ? "Revoke"
                  : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────── */
/* Sub-components                                  */
/* ──────────────────────────────────────────────── */

function KpiCard({
  label, value, icon: Icon, color, onClick,
}: {
  label: string; value: number; icon: typeof LayoutGrid; color: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors text-left w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </button>
  );
}

function QuickAction({
  label, icon: Icon, onClick,
}: {
  label: string; icon: typeof LayoutGrid; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg bg-gray-800/50 border border-gray-700 p-3 text-left transition-colors hover:bg-gray-800 hover:border-gray-600"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900/40 text-blue-400">
        <Icon size={14} />
      </div>
      <span className="text-xs font-medium text-gray-200 leading-tight">{label}</span>
    </button>
  );
}

function AnalyticsCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: string; icon: typeof Eye; color: string;
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: "bg-amber-900/40 text-amber-300",
    approved: "bg-blue-900/40 text-blue-300",
    confirmed: "bg-green-900/40 text-green-300",
    rejected: "bg-red-900/40 text-red-300",
    expired: "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] || map.expired}`}>
      {status}
    </span>
  );
}