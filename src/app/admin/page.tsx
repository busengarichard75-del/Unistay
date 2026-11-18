"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Users, BarChart3, Settings, Home, Store,
  Trash2, Eye, EyeOff, Shield, Calendar, BookOpen,
  Flag, Rocket, Wrench, Megaphone, TrendingUp, Download, Key, Package, Lock,
  Zap, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { getAllApprovedBookings, updateBookingStatus } from "@/services/bookingService";
import { getAnnouncement, updateAnnouncement } from "@/services/announcementService";
import { getAllProperties, updateProperty } from "@/services/propertyService";
import { getAllServices, updateService } from "@/services/serviceService";
import { getAllProducts, updateProduct } from "@/services/productService";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { Service, isServiceBoosted, BOOST_TIERS } from "@/types/service";
import { Product, isProductBoosted } from "@/types/product";
import { isBoosted } from "@/lib/boostService";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { createNotification } from "@/services/notificationService";
import {
  hideProperty, unhideProperty, bulkVerifyProperties, suspendUser, unsuspendUser,
  refundBoost, cancelBooking as cancelBookingAction, setSiteMode, getSiteMode,
  sendDirectMessage, SiteMode,
} from "@/services/adminActionsService";
import { getRecentAuditEntries, AuditEntry } from "@/services/auditLogService";
import { getAllReports, updateReportStatus } from "@/services/reportService";
import type { Report } from "@/types/report";
import {
  HidePropertyModal, RefundBoostModal, SuspendUserModal, CancelBookingModal,
  DirectMessageModal, SendEmailModal, SiteModeModal, ViewUserProfileModal,
  BulkVerifyModal, UserProfileData,
} from "@/components/admin/AdminModals";
import { getVisitStats, VisitStats } from "@/services/analyticsService";
import { DashboardTab } from "@/components/admin/tabs/DashboardTab";
import { PaymentsTab } from "@/components/admin/tabs/PaymentsTab";
import { PropertiesTab } from "@/components/admin/tabs/PropertiesTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { ShopTab } from "@/components/admin/tabs/ShopTab";
import { BookingsTab } from "@/components/admin/tabs/BookingsTab";
import { CommsTab } from "@/components/admin/tabs/CommsTab";
import { AnalyticsTab } from "@/components/admin/tabs/AnalyticsTab";
import { ReportsTab } from "@/components/admin/tabs/ReportsTab";
import { ToolsTab } from "@/components/admin/tabs/ToolsTab";
import { LibraryTab } from "@/components/admin/tabs/LibraryTab";
import { UpgradesTab } from "@/components/admin/tabs/UpgradesTab";
import { ArticlesTab } from "@/components/admin/tabs/ArticlesTab";
import { AskPezaTab } from "@/components/admin/tabs/AskPezaTab"; // ⭐ Added
import type { DirectoryUser, UnansweredQuestion, AdminStats } from "@/components/admin/types";
import { verifyAdminPassword, hasRealPassword } from "@/services/adminGateService";
import { ChangeAdminPasswordModal } from "@/components/admin/ChangeAdminPasswordModal";
import { MasterPinModal } from "@/components/admin/MasterPinModal";
import { SetMasterPinModal } from "@/components/admin/SetMasterPinModal";
import { hasMasterPin } from "@/services/masterPinService";
import {
  getLiveStats, LiveStats, deleteListingAdmin, hideListingAdmin,
  unhideListingAdmin, updateUserPlanAdmin, forcePasswordReset,
  exportUsersCSV, exportBookingsCSV, exportListingsCSV,
} from "@/services/adminPowerService";

const AGENT_FEE = 100;
const BOOST_FEE = 100;

type BigTabId = "accommodation" | "marketplace" | "control" | "stats" | "people";
type MiniTabId =
  | "properties" | "bookings" | "payments"
  | "shop" | "products" | "services" | "library"
  | "comms" | "upgrades" | "tools" | "security" | "articles" | "ask-peza"
  | "overview" | "traffic" | "revenue"
  | "users" | "reports";

const BIG_TABS: {
  id: BigTabId;
  label: string;
  icon: any;
  mini: { id: MiniTabId; label: string }[];
}[] = [
  {
    id: "accommodation", label: "Accommodation Affairs", icon: Home,
    mini: [
      { id: "properties", label: "Properties" },
      { id: "bookings", label: "Bookings" },
      { id: "payments", label: "Payments" },
    ],
  },
  {
    id: "marketplace", label: "Marketplace & Library", icon: Store,
    mini: [
      { id: "shop", label: "Shop Providers" },
      { id: "products", label: "Products" },
      { id: "services", label: "Services" },
      { id: "library", label: "Library" },
    ],
  },
  {
    id: "control", label: "Control Center", icon: Settings,
    mini: [
      { id: "comms", label: "Comms" },
      { id: "ask-peza", label: "Ask Peza" }, // ⭐ Added
      { id: "articles", label: "Articles" },
      { id: "upgrades", label: "Plan Upgrades" },
      { id: "tools", label: "Tools" },
      { id: "security", label: "Security" },
    ],
  },
  {
    id: "stats", label: "Statistics", icon: BarChart3,
    mini: [
      { id: "overview", label: "Overview" },
      { id: "traffic", label: "Traffic" },
      { id: "revenue", label: "Revenue" },
    ],
  },
  {
    id: "people", label: "People & Trust", icon: Users,
    mini: [
      { id: "users", label: "Users" },
      { id: "reports", label: "Reports" },
    ],
  },
];

const OLD_TAB_MAP: Record<string, [BigTabId, MiniTabId]> = {
  dashboard: ["stats", "overview"],
  payments: ["accommodation", "payments"],
  properties: ["accommodation", "properties"],
  users: ["people", "users"],
  shop: ["marketplace", "shop"],
  upgrades: ["control", "upgrades"],
  bookings: ["accommodation", "bookings"],
  comms: ["control", "comms"],
  analytics: ["stats", "traffic"],
  reports: ["people", "reports"],
  library: ["marketplace", "library"],
  tools: ["control", "tools"],
};

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [masterPrompt, setMasterPrompt] = useState<{
    title: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [showSetMasterPinModal, setShowSetMasterPinModal] = useState(false);
  const [masterPinSet, setMasterPinSet] = useState(false);

  const [activeBigTab, setActiveBigTab] = useState<BigTabId>("accommodation");
  const [activeMiniTab, setActiveMiniTab] = useState<Record<BigTabId, MiniTabId>>({
    accommodation: "properties",
    marketplace: "shop",
    control: "comms",
    stats: "overview",
    people: "users",
  });
  const currentMiniTab = activeMiniTab[activeBigTab];

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
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [boostSearchTerm, setBoostSearchTerm] = useState("");
  const [isTogglingBoost, setIsTogglingBoost] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<"all" | "pending" | "hidden">("all");

  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "landlord" | "service_provider">("all");
  const [userUniversityFilter, setUserUniversityFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "suspended">("all");

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

  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [isFetchingLiveStats, setIsFetchingLiveStats] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

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
  const [deleteListingModal, setDeleteListingModal] = useState<{ kind: "property" | "service" | "product"; id: string; title: string; ownerId: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [providerFilter, setProviderFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [busyProviderId, setBusyProviderId] = useState<string | null>(null);
  const [busyBoostId, setBusyBoostId] = useState<string | null>(null);
  const [rejectProviderModal, setRejectProviderModal] = useState<DirectoryUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [reports, setReports] = useState<Report[]>([]);
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats>({
    totalProperties: 0, totalBookings: 0, pendingPayments: 0, boostedListings: 0,
    totalStudents: 0, totalLandlords: 0, completedBookings: 0, boostRevenue: 0,
    agentFeeRevenue: 0, totalRevenue: 0, hiddenProperties: 0,
  });

  const adminCtx = useMemo(
    () => ({ adminId: user?.uid || "", adminEmail: user?.email || "" }),
    [user]
  );

  const requireMasterPin = (config: { title: string; description?: string }, action: () => void | Promise<void>) => {
    if (!masterPinSet) {
      toast.error("Set a master PIN first: Control Center → Security");
      setActiveBigTab("control");
      setActiveMiniTab((prev) => ({ ...prev, control: "security" }));
      setShowSetMasterPinModal(true);
      return;
    }
    setMasterPrompt({ ...config, onConfirm: action });
  };

  const fetchAllData = async () => {
    setIsFetching(true); setIsFetchingProperties(true); setIsFetchingUsers(true); setLoadingSettings(true);
    try {
      const bookingsData = await getAllApprovedBookings();
      setBookings(bookingsData); setFilteredBookings(bookingsData);

      const allPropsSnap = await getDocs(collection(db, "properties"));
      const allProps = allPropsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Property));
      setAllProperties(allProps);

      const [servicesSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, "services")), getDocs(collection(db, "products")),
      ]);
      setAllServices(servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Service)));
      setAllProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));

      const pendingSnap = await getDocs(query(collection(db, "properties"), where("verificationStatus", "==", "pending")));
      setPendingProperties(pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Property)));

      const usersRef = collection(db, "users");
      const [studentSnap, landlordSnap, allUsersSnap] = await Promise.all([
        getDocs(query(usersRef, where("role", "==", "student"))),
        getDocs(query(usersRef, where("role", "==", "landlord"))),
        getDocs(usersRef),
      ]);
      setDirectoryUsers(allUsersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as DirectoryUser)));

      const allBookingsSnap = await getDocs(collection(db, "bookings"));
      const allBookingsList = allBookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      setAllBookings(allBookingsList);

      const completedBookings = allBookingsList.filter((b) => b.status === "confirmed").length;
      const pendingPayments = allBookingsList.filter((b) => b.status === "approved").length;
      const boosted = allProps.filter((p) => isBoosted(p)).length;
      const hiddenProperties = allProps.filter((p) => p.adminHidden === true).length;
      const boostRevenue = boosted * BOOST_FEE;
      const agentFeeRevenue = completedBookings * AGENT_FEE;

      setStats({
        totalProperties: allProps.length, totalBookings: allBookingsList.length,
        pendingPayments, boostedListings: boosted,
        totalStudents: studentSnap.size, totalLandlords: landlordSnap.size,
        completedBookings, boostRevenue, agentFeeRevenue,
        totalRevenue: boostRevenue + agentFeeRevenue, hiddenProperties,
      });
      setError(null);
    } catch (err) {
      console.error(err); setError("Failed to load admin data.");
    } finally {
      setIsFetching(false); setIsFetchingProperties(false); setIsFetchingUsers(false); setLoadingSettings(false);
    }
  };

  const fetchAnnounce = async () => {
    try { const d = await getAnnouncement(); if (d) { setAnnounceContent(d.content || ""); setIsActive(d.isActive || false); } }
    catch {} finally { setLoadingAnnounce(false); }
  };
  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "main"));
      if (snap.exists()) setStatsReset(snap.data().statsReset || false);
      setCurrentSiteMode((await getSiteMode()).mode);
    } catch {} finally { setLoadingSettings(false); }
  };
  const fetchQuestions = async () => {
    setIsFetchingQuestions(true);
    try {
      const snap = await getDocs(query(collection(db, "unansweredQuestions"), orderBy("createdAt", "desc")));
      setUnansweredQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UnansweredQuestion)));
    } catch {} finally { setIsFetchingQuestions(false); }
  };
  const fetchAudit = async () => {
    setIsFetchingAudit(true);
    try { setAuditEntries(await getRecentAuditEntries(200)); } finally { setIsFetchingAudit(false); }
  };
  const fetchAnalytics = async () => {
    setIsFetchingAnalytics(true);
    const sinceMs = analyticsRange === "24h" ? Date.now() - 86400000
      : analyticsRange === "7d" ? Date.now() - 7 * 86400000
      : analyticsRange === "30d" ? Date.now() - 30 * 86400000 : 0;
    try { setAnalytics(await getVisitStats(sinceMs)); } finally { setIsFetchingAnalytics(false); }
  };
  const fetchReports = async () => {
    setIsFetchingReports(true);
    try { setReports(await getAllReports()); } finally { setIsFetchingReports(false); }
  };
  const fetchLive = async () => {
    setIsFetchingLiveStats(true);
    try { setLiveStats(await getLiveStats()); }
    catch (err) { console.error(err); toast.error("Failed to load live stats."); }
    finally { setIsFetchingLiveStats(false); }
  };

  const handlePurgeCache = async () => {
    setIsPurging(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error("Not authenticated."); return; }
      const res = await fetch("/api/admin/purge-cache", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "Cache purged.");
      else toast.error(data.error || "Failed to purge cache.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to purge cache.");
    } finally {
      setIsPurging(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAdminEmail(user?.email)) { router.push("/"); return; }
    if (isPinVerified) {
      fetchAllData(); fetchAnnounce(); fetchSettings(); fetchQuestions();
      fetchAudit(); fetchAnalytics(); fetchReports(); fetchLive();
      hasMasterPin().then(setMasterPinSet).catch(() => setMasterPinSet(false));
    }
  }, [user, isLoading, router, isPinVerified, analyticsRange]);

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredBookings(bookings); return; }
    const q = searchTerm.toLowerCase().trim();
    setFilteredBookings(bookings.filter((b) =>
      b.studentName.toLowerCase().includes(q)
      || b.propertyTitle.toLowerCase().includes(q)
      || b.studentId.toLowerCase().includes(q)));
  }, [searchTerm, bookings]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ok = await verifyAdminPassword(pin);
      if (ok) {
        setIsPinVerified(true); setPinError("");
        setNeedsPasswordSetup(!(await hasRealPassword()));
      } else { setPinError("Incorrect password."); setPin(""); }
    } catch { setPinError("Verification failed."); }
  };

  const handleGoToTab = (oldTab: string) => {
    const target = OLD_TAB_MAP[oldTab];
    if (target) {
      const [big, mini] = target;
      setActiveBigTab(big);
      setActiveMiniTab((prev) => ({ ...prev, [big]: mini }));
    }
  };

  async function handleMarkPaid(bookingId: string) {
    setIsSubmitting(bookingId);
    try {
      await updateBookingStatus(bookingId, { status: "confirmed", confirmedAt: Date.now() });
      const updated = bookings.filter((b) => b.id !== bookingId);
      setBookings(updated); setFilteredBookings(updated);
      const b = bookings.find((x) => x.id === bookingId);
      if (b) {
        await createNotification(b.studentId, { title: "Booking Confirmed 🎉", body: `Your booking at "${b.propertyTitle}" is confirmed.`, type: "booking_confirmed", link: "/dashboard/student" });
        await createNotification(b.landlordId, { title: "Booking Confirmed 🎉", body: `${b.studentName}'s booking confirmed.`, type: "booking_confirmed", link: "/dashboard/landlord" });
        fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: b.id, type: "booking_confirmed" }) }).catch(() => {});
      }
      toast.success("Payment confirmed!");
    } catch { toast.error("Failed to confirm."); } finally { setIsSubmitting(null); }
  }

  const handlePublishAnnounce = async () => {
    if (!announceContent.trim()) { toast.error("Write a message."); return; }
    setIsUpdatingAnnounce(true);
    try {
      await updateAnnouncement({ content: announceContent.trim(), isActive: true });
      setIsActive(true);
      toast.success("Published!");
      if (sendPush) {
        const res = await fetch("/api/admin/announce", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "📢 Announcement", body: announceContent.trim(), targetRole: pushTarget === "all" ? undefined : pushTarget }) });
        const data = await res.json();
        if (res.ok) toast.success(`Push sent to ${data.sent} users.`);
      }
    } catch { toast.error("Failed."); } finally { setIsUpdatingAnnounce(false); }
  };

  const handleHideAnnounce = async () => {
    setIsUpdatingAnnounce(true);
    try { await updateAnnouncement({ isActive: false }); setIsActive(false); toast.success("Hidden."); }
    catch { toast.error("Failed."); } finally { setIsUpdatingAnnounce(false); }
  };

  const handleToggleBoost = async (property: Property) => {
    setIsTogglingBoost(property.id);
    try {
      const newBoosted = !isBoosted(property);
      const upd: any = { isBoosted: newBoosted, boostedAt: newBoosted ? Date.now() : null, boostExpiry: newBoosted ? Date.now() + 30 * 86400000 : null };
      await updateProperty(property.id, upd);
      setAllProperties((prev) => prev.map((p) => (p.id === property.id ? { ...p, ...upd } : p)));
      toast.success(`Property ${newBoosted ? "boosted" : "unboosted"}!`);
    } catch { toast.error("Failed."); } finally { setIsTogglingBoost(null); }
  };

  const handleVerifyProperty = async (property: Property, status: "approved" | "rejected") => {
    setIsVerifying(property.id);
    try {
      await updateProperty(property.id, { verificationStatus: status });
      setPendingProperties((prev) => prev.filter((p) => p.id !== property.id));
      setAllProperties((prev) => prev.map((p) => (p.id === property.id ? { ...p, verificationStatus: status } : p)));
      const notifTitle = status === "approved" ? "Your listing is live! 🎉" : "Listing needs changes";
      const notifBody = status === "approved" ? `"${property.title}" is approved.` : `"${property.title}" wasn't approved.`;
      try {
        await createNotification(property.ownerId, { title: notifTitle, body: notifBody, type: "announcement", link: "/dashboard/landlord" });
        await sendPushNotification({ userId: property.ownerId, title: notifTitle, body: notifBody, url: "/dashboard/landlord" });
      } catch {}
      toast.success(`Property ${status}.`);
    } catch { toast.error("Failed."); } finally { setIsVerifying(null); }
  };

  const handleResetStats = async () => {
    if (!window.confirm("Reset stats?")) return;
    try { await setDoc(doc(db, "settings", "main"), { statsReset: true }, { merge: true }); setStatsReset(true); toast.success("Reset."); }
    catch { toast.error("Failed."); }
  };
  const handleShowStats = async () => {
    try { await setDoc(doc(db, "settings", "main"), { statsReset: false }, { merge: true }); setStatsReset(false); toast.success("Restored."); }
    catch { toast.error("Failed."); }
  };

  const handleMarkResolved = async (questionId: string) => {
    setIsResolving(questionId);
    try {
      await updateDoc(doc(db, "unansweredQuestions", questionId), { resolved: true });
      setUnansweredQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, resolved: true } : q)));
      toast.success("Resolved.");
    } catch { toast.error("Failed."); } finally { setIsResolving(null); }
  };

  const confirmHide = async (reason: string) => {
    if (!hideModal) return;
    await hideProperty(adminCtx, hideModal.id, hideModal.title, hideModal.ownerId, reason);
    setAllProperties((prev) => prev.map((p) => p.id === hideModal.id ? { ...p, adminHidden: true, adminHiddenReason: reason } : p));
    setStats((s) => ({ ...s, hiddenProperties: s.hiddenProperties + 1 }));
    toast.success("Hidden."); setHideModal(null); fetchAudit();
  };
  const handleUnhide = async (p: Property) => {
    await unhideProperty(adminCtx, p.id, p.title, p.ownerId);
    setAllProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, adminHidden: false, adminHiddenReason: undefined } : x));
    setStats((s) => ({ ...s, hiddenProperties: Math.max(0, s.hiddenProperties - 1) }));
    toast.success("Restored."); fetchAudit();
  };
  const toggleSelectProp = (id: string) => {
    setSelectedPropertyIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const confirmBulk = async () => {
    if (!bulkModal) return;
    const n = await bulkVerifyProperties(adminCtx, selectedPropertyIds, bulkModal.status);
    setPendingProperties((prev) => prev.filter((p) => !selectedPropertyIds.includes(p.id)));
    setAllProperties((prev) => prev.map((p) => selectedPropertyIds.includes(p.id) ? { ...p, verificationStatus: bulkModal.status } : p));
    toast.success(`${n} properties ${bulkModal.status}.`);
    setSelectedPropertyIds([]); setBulkModal(null); fetchAudit();
  };

  const requestRefund = () => {
    if (!refundModal) return;
    const target = refundModal;
    setRefundModal(null);
    requireMasterPin(
      { title: "Refund this boost?", description: `Refund the K100 boost for "${target.title}".` },
      () => runRefund(target)
    );
  };
  const runRefund = async (target: { id: string; title: string }) => {
    await refundBoost(adminCtx, target.id, target.title);
    setAllProperties((prev) => prev.map((p) => p.id === target.id ? { ...p, isBoosted: false, boostExpiry: undefined } : p));
    toast.success("Refunded."); fetchAudit();
  };

  const requestSuspend = (reason: string) => {
    if (!suspendModal) return;
    const target = suspendModal;
    setSuspendModal(null); setProfileModal(null);
    if (target.currentlySuspended) {
      runSuspendAction(target, reason);
    } else {
      requireMasterPin(
        { title: "Suspend this user?", description: `Suspend "${target.name}". Reason: ${reason}` },
        () => runSuspendAction(target, reason)
      );
    }
  };
  const runSuspendAction = async (target: { uid: string; name: string; currentlySuspended: boolean }, reason: string) => {
    try {
      if (target.currentlySuspended) {
        await unsuspendUser(adminCtx, target.uid, target.name);
        setDirectoryUsers((prev) => prev.map((u) => u.uid === target.uid ? { ...u, suspended: false, suspendedReason: undefined } : u));
        toast.success("Unsuspended.");
      } else {
        await suspendUser(adminCtx, target.uid, target.name, reason);
        setDirectoryUsers((prev) => prev.map((u) => u.uid === target.uid ? { ...u, suspended: true, suspendedReason: reason } : u));
        toast.success("Suspended.");
      }
      fetchAudit();
    } catch { toast.error("Failed."); }
  };

  const openUserProfile = async (u: DirectoryUser) => {
    setProfileLoading(true);
    setProfileModal({ uid: u.uid, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, university: u.university, studentNumber: u.studentNumber, createdAt: u.createdAt, suspended: u.suspended, suspendedReason: u.suspendedReason, listings: [], bookings: [] });
    try {
      const listings = allProperties.filter((p) => p.ownerId === u.uid).map((p) => ({ id: p.id, title: p.title, price: p.price, location: p.location }));
      const related = allBookings.filter((b) => u.role === "landlord" ? b.landlordId === u.uid : b.studentId === u.uid)
        .map((b) => ({ id: b.id, propertyTitle: b.propertyTitle, studentName: b.studentName, price: b.price, status: b.status, createdAt: b.createdAt }));
      setProfileModal((prev) => prev ? { ...prev, listings, bookings: related.slice(0, 20) } : prev);
    } finally { setProfileLoading(false); }
  };

  const requestForcePasswordReset = () => {
    if (!profileModal) return;
    const target = profileModal;
    if (!window.confirm(`Send password reset email to ${target.email}?`)) return;
    runForcePasswordReset(target);
  };
  const runForcePasswordReset = async (target: UserProfileData) => {
    try {
      await forcePasswordReset(adminCtx, target.email, target.fullName || target.email);
      toast.success(`Password reset email sent to ${target.email}`);
      fetchAudit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email.");
    }
  };

  const confirmDirectMessage = async (title: string, body: string) => {
    if (!dmModal) return;
    await sendDirectMessage(adminCtx, dmModal.uid, dmModal.name, title, body);
    toast.success("Sent."); setDmModal(null); fetchAudit();
  };
  const confirmEmail = async (subject: string, message: string) => {
    if (!emailModal) return;
    try {
      const res = await fetch("/api/admin/send-email", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: adminCtx.adminEmail, to: emailModal.email, subject, message }) });
      const data = await res.json();
      if (data.success) { toast.success("Sent."); setEmailModal(null); fetchAudit(); }
      else toast.error("Failed: " + data.error);
    } catch { toast.error("Failed."); }
  };

  const requestCancelBooking = (reason: string) => {
    if (!cancelBookingModal) return;
    const target = cancelBookingModal;
    setCancelBookingModal(null);
    requireMasterPin(
      { title: "Cancel this booking?", description: `Cancel booking for "${target.propertyTitle}" — ${target.studentName}. Reason: ${reason}` },
      () => runCancelBooking(target, reason)
    );
  };
  const runCancelBooking = async (target: Booking, reason: string) => {
    await cancelBookingAction(adminCtx, target.id, target.propertyTitle, target.studentId, target.landlordId, reason);
    setAllBookings((prev) => prev.map((x) => x.id === target.id ? { ...x, status: "rejected" as any } : x));
    toast.success("Cancelled."); fetchAudit();
  };

  const confirmSiteMode = async (mode: SiteMode, message: string) => {
    await setSiteMode(adminCtx, mode, message); setCurrentSiteMode(mode);
    toast.success(`Site: ${mode === "off" ? "Normal" : "Read-only"}`); setSiteModeModal(false); fetchAudit();
  };

  const handleApproveProvider = async (provider: DirectoryUser) => {
    setBusyProviderId(provider.uid);
    try {
      await updateDoc(doc(db, "users", provider.uid), {
        verificationStatus: "approved", verificationReason: null,
        verificationReviewedAt: Date.now(), verificationReviewedBy: adminCtx.adminEmail,
      });
      setDirectoryUsers((prev) => prev.map((u) => u.uid === provider.uid ? { ...u, verificationStatus: "approved", verificationReason: null } : u));
      try {
        await createNotification(provider.uid, { title: "You're verified! 🎉", body: "Your Peza provider account is approved.", type: "announcement", link: "/dashboard/provider" });
        await sendPushNotification({ userId: provider.uid, title: "You're verified! 🎉", body: "Your provider account is approved.", url: "/dashboard/provider" });
      } catch {}
      toast.success("Approved."); fetchAudit();
    } catch { toast.error("Failed."); } finally { setBusyProviderId(null); }
  };
  const handleRejectProvider = async () => {
    if (!rejectProviderModal || !rejectReason.trim()) return;
    setBusyProviderId(rejectProviderModal.uid);
    try {
      await updateDoc(doc(db, "users", rejectProviderModal.uid), {
        verificationStatus: "rejected", verificationReason: rejectReason.trim(),
        verificationReviewedAt: Date.now(), verificationReviewedBy: adminCtx.adminEmail,
      });
      setDirectoryUsers((prev) => prev.map((u) => u.uid === rejectProviderModal.uid ? { ...u, verificationStatus: "rejected", verificationReason: rejectReason.trim() } : u));
      try {
        await createNotification(rejectProviderModal.uid, { title: "Account update", body: `Not approved. Reason: ${rejectReason.trim()}.`, type: "announcement", link: "/dashboard/provider" });
      } catch {}
      toast.success("Rejected."); setRejectProviderModal(null); setRejectReason(""); fetchAudit();
    } catch { toast.error("Failed."); } finally { setBusyProviderId(null); }
  };

  const handleActivateBoost = async (kind: "service" | "product", id: string, title: string, ownerId: string) => {
    setBusyBoostId(id);
    try {
      const now = Date.now();
      const source = kind === "service" ? allServices.find((s) => s.id === id) : allProducts.find((p) => p.id === id);
      const dur = (source as any)?.boostRequestedDuration;
      const tier = BOOST_TIERS.find((t) => t.id === dur) || BOOST_TIERS.find((t) => t.id === "weekly")!;
      const upd: any = { isBoosted: true, boostedAt: now, boostExpiry: now + tier.ms, boostRequested: false, boostRequestedDuration: null, boostRequestedAmount: null };
      if (kind === "service") {
        await updateService(id, upd);
        setAllServices((prev) => prev.map((s) => s.id === id ? { ...s, ...upd } : s));
      } else {
        await updateProduct(id, upd);
        setAllProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...upd } : p));
      }
      try {
        await createNotification(ownerId, { title: "Boost active ⚡", body: `"${title}" is now featured.`, type: "announcement", link: "/dashboard/provider" });
      } catch {}
      toast.success("Boost activated."); fetchAudit();
    } catch { toast.error("Failed."); } finally { setBusyBoostId(null); }
  };
  const handleDeactivateBoost = async (kind: "service" | "product", id: string, title: string) => {
    setBusyBoostId(id);
    try {
      const upd = { isBoosted: false, boostExpiry: null };
      if (kind === "service") { await updateService(id, upd); setAllServices((prev) => prev.map((s) => s.id === id ? { ...s, ...upd } : s)); }
      else { await updateProduct(id, upd); setAllProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...upd } : p)); }
      toast.success(`Boost removed from "${title}".`); fetchAudit();
    } catch { toast.error("Failed."); } finally { setBusyBoostId(null); }
  };

  const handleTakeDownReport = async (report: Report) => {
    setBusyReportId(report.id);
    try {
      if (report.targetType === "service") {
        await updateService(report.targetId, { adminHidden: true, adminHiddenReason: `Reported: ${report.reason}` });
        setAllServices((prev) => prev.map((s) => s.id === report.targetId ? { ...s, adminHidden: true } : s));
      } else {
        await updateProduct(report.targetId, { adminHidden: true, adminHiddenReason: `Reported: ${report.reason}` });
        setAllProducts((prev) => prev.map((p) => p.id === report.targetId ? { ...p, adminHidden: true } : p));
      }
      await updateReportStatus(report.id, "resolved", adminCtx.adminEmail);
      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: "resolved", reviewedAt: Date.now(), reviewedBy: adminCtx.adminEmail } : r));
      toast.success("Taken down."); fetchAudit();
    } catch { toast.error("Failed."); } finally { setBusyReportId(null); }
  };
  const handleDismissReport = async (report: Report) => {
    setBusyReportId(report.id);
    try {
      await updateReportStatus(report.id, "dismissed", adminCtx.adminEmail);
      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: "dismissed", reviewedAt: Date.now(), reviewedBy: adminCtx.adminEmail } : r));
      toast.success("Dismissed."); fetchAudit();
    } catch { toast.error("Failed."); } finally { setBusyReportId(null); }
  };

  const requestUpdatePlan = async (uid: string, plan: "basic" | "pro" | "full_time"): Promise<void> => {
    const userName = directoryUsers.find((u) => u.uid === uid)?.email || uid;
    requireMasterPin(
      { title: "Change user plan?", description: `Change "${userName}" to the ${plan} plan?` },
      () => runUpdatePlan(uid, plan)
    );
  };
  const runUpdatePlan = async (uid: string, plan: "basic" | "pro" | "full_time") => {
    await updateUserPlanAdmin(adminCtx, uid, directoryUsers.find((u) => u.uid === uid)?.email || uid, plan);
    const planExpiry = plan === "basic" ? undefined : Date.now() + 30 * 86400000;
    setDirectoryUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, plan, planExpiry } : u));
    fetchAudit();
  };

  const requestDeleteListing = () => {
    if (!deleteListingModal || !deleteReason.trim()) {
      toast.error("Provide a reason.");
      return;
    }
    const target = deleteListingModal;
    const reason = deleteReason.trim();
    setDeleteListingModal(null);
    setDeleteReason("");
    requireMasterPin(
      { title: "Delete this listing?", description: `Permanently remove "${target.title}". The owner will be notified.` },
      () => runDeleteListing(target, reason)
    );
  };
  const runDeleteListing = async (
    target: { kind: "property" | "service" | "product"; id: string; title: string; ownerId: string },
    reason: string
  ) => {
    await deleteListingAdmin(adminCtx, target.kind, target.id, target.title, target.ownerId, reason);
    if (target.kind === "property") setAllProperties((prev) => prev.filter((x) => x.id !== target.id));
    else if (target.kind === "service") setAllServices((prev) => prev.filter((x) => x.id !== target.id));
    else setAllProducts((prev) => prev.filter((x) => x.id !== target.id));
    toast.success("Deleted."); fetchAudit();
  };

  const requestChangeAdminPassword = () => {
    requireMasterPin(
      { title: "Change admin password?", description: "You'll enter the current admin password on the next screen." },
      () => setShowChangePasswordModal(true)
    );
  };

  const toggleFeatureOnHomepage = async (
    kind: "service" | "product",
    id: string,
    title: string,
    currentlyFeatured: boolean
  ) => {
    try {
      const update = currentlyFeatured
        ? { featuredOnHomepage: false, featuredAt: undefined, featuredBy: undefined }
        : { featuredOnHomepage: true, featuredAt: Date.now(), featuredBy: adminCtx.adminEmail };

      if (kind === "service") {
        await updateService(id, update as any);
        setAllServices((prev) => prev.map((s) => s.id === id ? { ...s, ...update } as Service : s));
      } else {
        await updateProduct(id, update as any);
        setAllProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...update } as Product : p));
      }

      toast.success(currentlyFeatured ? `"${title}" removed from homepage` : `"${title}" is now featured on the homepage`);
      fetchAudit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update feature.");
    }
  };

  const filteredQuestions = showResolved ? unansweredQuestions : unansweredQuestions.filter((q) => !q.resolved);
  const filteredUsers = directoryUsers.filter((u) => {
    const s = userSearchTerm.toLowerCase();
    const matchSearch = !s || (u.fullName || "").toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone || "").includes(s);
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const matchUniversity = userUniversityFilter === "all" || u.university === userUniversityFilter;
    const matchStatus = userStatusFilter === "all" ? true : userStatusFilter === "suspended" ? !!u.suspended : !u.suspended;
    return matchSearch && matchRole && matchUniversity && matchStatus;
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
      return (p.fullName || "").toLowerCase().includes(s) || (p.businessName || "").toLowerCase().includes(s) || p.email.toLowerCase().includes(s);
    });

  if (isLoading || loadingSettings) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-pulse h-8 w-48 rounded bg-gray-700" /></div>;
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password" value={pin} onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-center text-lg text-white placeholder-gray-500 outline-none focus:border-blue-500"
                placeholder="Enter admin password" autoFocus
              />
              {pinError && <p className="mt-2 text-sm text-red-400">{pinError}</p>}
            </div>
            <button type="submit" disabled={pin.length === 0}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderStatsOverview = () => {
    return (
      <div className="space-y-6">
        <DashboardTab
          stats={stats}
          providerPendingCount={providerCounts.pending}
          auditEntries={auditEntries}
          statsReset={statsReset}
          onShowStats={handleShowStats}
          onResetStats={handleResetStats}
          onGoToTab={handleGoToTab as any}
        />

        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Live Verified Counts</h3>
              <p className="text-xs text-gray-500 mt-0.5">Exact numbers from Firestore aggregation</p>
            </div>
            <button onClick={fetchLive} disabled={isFetchingLiveStats}
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-50">
              <RefreshCw size={12} className={`inline mr-1 ${isFetchingLiveStats ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {isFetchingLiveStats || !liveStats ? (
            <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Total Users", value: liveStats.totalUsers, sub: `${liveStats.newUsers7d} new / 7d · ${liveStats.newUsers30d} new / 30d`, icon: Users, color: "text-purple-400" },
                  { label: "Students", value: liveStats.totalStudents, sub: "", icon: Users, color: "text-blue-400" },
                  { label: "Landlords", value: liveStats.totalLandlords, sub: "", icon: Home, color: "text-cyan-400" },
                  { label: "Providers", value: liveStats.totalProviders, sub: "", icon: Store, color: "text-emerald-400" },
                  { label: "Properties", value: liveStats.totalProperties, sub: `${liveStats.hiddenProperties} hidden`, icon: Home, color: "text-cyan-400" },
                  { label: "Services", value: liveStats.totalServices, sub: `${liveStats.hiddenServices} hidden`, icon: Package, color: "text-emerald-400" },
                  { label: "Products", value: liveStats.totalProducts, sub: `${liveStats.hiddenProducts} hidden`, icon: Package, color: "text-amber-400" },
                  { label: "Confirmed Bookings", value: liveStats.confirmedBookings, sub: `${liveStats.pendingBookings} pending · ${liveStats.cancelledBookings} cancelled`, icon: Calendar, color: "text-green-400" },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">{c.label}</p>
                        <Icon size={12} className={c.color} />
                      </div>
                      <p className="text-xl font-bold text-white">{c.value.toLocaleString()}</p>
                      {c.sub && <p className="text-[10px] text-gray-500 mt-0.5">{c.sub}</p>}
                    </div>
                  );
                })}
              </div>

              {liveStats.suspendedUsers > 0 && (
                <div className="rounded-lg bg-red-900/20 border border-red-800/50 p-2.5 text-xs text-red-300 mb-3">
                  <strong>{liveStats.suspendedUsers}</strong> suspended account{liveStats.suspendedUsers === 1 ? "" : "s"}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={exportUsersCSV} className="rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-700">
                  <Download size={11} className="inline mr-1" /> Export Users
                </button>
                <button onClick={exportBookingsCSV} className="rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-700">
                  <Download size={11} className="inline mr-1" /> Export Bookings
                </button>
                <button onClick={exportListingsCSV} className="rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-700">
                  <Download size={11} className="inline mr-1" /> Export Listings
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderRevenue = () => {
    const agentFee = stats.agentFeeRevenue;
    const boost = stats.boostRevenue;
    const total = agentFee + boost;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-emerald-800 bg-emerald-900/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400">Total Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">K{total.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-blue-800 bg-blue-900/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-blue-400">Agent Fees</p>
            <p className="text-2xl font-bold text-white mt-1">K{agentFee.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 mt-1">{stats.completedBookings} × K100</p>
          </div>
          <div className="rounded-2xl border border-amber-800 bg-amber-900/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-amber-400">Boost Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">K{boost.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 mt-1">{stats.boostedListings} active boosts</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
          <p className="text-xs font-semibold text-white mb-2">Summary</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Completed bookings: <span className="text-white">{stats.completedBookings}</span></li>
            <li>• Pending payments: <span className="text-white">{stats.pendingPayments}</span></li>
            <li>• Active boosts: <span className="text-white">{stats.boostedListings}</span></li>
            <li>• Average per booking: <span className="text-white">K{stats.completedBookings > 0 ? (agentFee / stats.completedBookings).toFixed(0) : 0}</span></li>
          </ul>
        </div>
      </div>
    );
  };

  const renderSecurityTab = () => (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-5 ${masterPinSet ? "border-emerald-800/50 bg-emerald-900/10" : "border-amber-800/50 bg-amber-900/10"}`}>
        <h3 className="text-sm font-semibold text-white mb-1">Master PIN</h3>
        <p className="text-xs text-gray-400 mb-4">
          Required for all destructive actions: delete listings, suspend users, change plans, refund boosts, cancel bookings, and change admin password. Only the head admin should know this.
        </p>
        <button onClick={() => setShowSetMasterPinModal(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${masterPinSet ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
          <Lock size={14} className="inline mr-1" /> {masterPinSet ? "Change Master PIN" : "Set Master PIN"}
        </button>
        {masterPinSet && <p className="mt-2 text-xs text-emerald-400">✓ Master PIN is configured</p>}
        {!masterPinSet && <p className="mt-2 text-xs text-amber-400">⚠ Not set yet — destructive actions are locked</p>}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Admin Password</h3>
        <p className="text-xs text-gray-500 mb-4">Change the password used to enter this admin panel. Master PIN required.</p>
        <button onClick={requestChangeAdminPassword}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Key size={14} className="inline mr-1" /> Change Admin Password
        </button>
        {needsPasswordSetup && (
          <div className="mt-3 rounded-lg bg-amber-900/30 border border-amber-800 p-3 text-xs text-amber-300">
            You are still using the legacy default PIN. Set a real password now.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Cache</h3>
        <p className="text-xs text-gray-500 mb-4">
          Clear cached pages so users immediately see the latest content. Use this after deploying updates or when users report stale data.
        </p>
        <button onClick={handlePurgeCache} disabled={isPurging}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
          <Zap size={14} className="inline mr-1" /> {isPurging ? "Purging..." : "Purge Cache"}
        </button>
      </div>
    </div>
  );

  const renderProductsList = () => (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">All Products ({allProducts.length})</h3>
        <p className="text-xs text-gray-500 mt-0.5">Hide (reversible) · Feature on homepage · Delete (requires master PIN)</p>
      </div>
      <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
        {allProducts.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {p.name}
                {p.featuredOnHomepage && <span className="ml-2 text-[10px] text-purple-400">⭐ FEATURED</span>}
              </p>
              <p className="text-xs text-gray-500">K{p.price} · {p.category}</p>
            </div>
            <div className="flex gap-2 ml-3 flex-wrap">
              <button onClick={() => toggleFeatureOnHomepage("product", p.id, p.name, p.featuredOnHomepage === true)}
                className={`rounded-lg px-2.5 py-1 text-[11px] ${
                  p.featuredOnHomepage
                    ? "bg-purple-900/60 text-purple-200 hover:bg-purple-900/80"
                    : "bg-purple-900/30 text-purple-300 hover:bg-purple-900/60"
                }`}>
                <Sparkles size={12} className="inline" /> {p.featuredOnHomepage ? "Unfeature" : "Feature"}
              </button>
              {p.adminHidden ? (
                <button onClick={async () => {
                  await unhideListingAdmin(adminCtx, "product", p.id, p.name);
                  setAllProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, adminHidden: false } : x));
                  toast.success("Restored."); fetchAudit();
                }} className="rounded-lg bg-emerald-900/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/60">
                  <Eye size={12} className="inline" /> Restore
                </button>
              ) : (
                <button onClick={async () => {
                  const r = window.prompt("Reason for hiding:"); if (!r) return;
                  await hideListingAdmin(adminCtx, "product", p.id, p.name, r);
                  setAllProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, adminHidden: true } : x));
                  toast.success("Hidden."); fetchAudit();
                }} className="rounded-lg bg-amber-900/40 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900/60">
                  <EyeOff size={12} className="inline" /> Hide
                </button>
              )}
              <button onClick={() => setDeleteListingModal({ kind: "product", id: p.id, title: p.name, ownerId: p.ownerId })}
                className="rounded-lg bg-red-900/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/60">
                <Trash2 size={12} className="inline" /> Delete
              </button>
            </div>
          </div>
        ))}
        {allProducts.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-500">No products yet.</div>}
      </div>
    </div>
  );

  const renderServicesList = () => (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white">All Services ({allServices.length})</h3>
        <p className="text-xs text-gray-500 mt-0.5">Hide (reversible) · Feature on homepage · Delete (requires master PIN)</p>
      </div>
      <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
        {allServices.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {s.title}
                {s.featuredOnHomepage && <span className="ml-2 text-[10px] text-purple-400">⭐ FEATURED</span>}
              </p>
              <p className="text-xs text-gray-500">{s.category}</p>
            </div>
            <div className="flex gap-2 ml-3 flex-wrap">
              <button onClick={() => toggleFeatureOnHomepage("service", s.id, s.title, s.featuredOnHomepage === true)}
                className={`rounded-lg px-2.5 py-1 text-[11px] ${
                  s.featuredOnHomepage
                    ? "bg-purple-900/60 text-purple-200 hover:bg-purple-900/80"
                    : "bg-purple-900/30 text-purple-300 hover:bg-purple-900/60"
                }`}>
                <Sparkles size={12} className="inline" /> {s.featuredOnHomepage ? "Unfeature" : "Feature"}
              </button>
              {s.adminHidden ? (
                <button onClick={async () => {
                  await unhideListingAdmin(adminCtx, "service", s.id, s.title);
                  setAllServices((prev) => prev.map((x) => x.id === s.id ? { ...x, adminHidden: false } : x));
                  toast.success("Restored."); fetchAudit();
                }} className="rounded-lg bg-emerald-900/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/60">
                  <Eye size={12} className="inline" /> Restore
                </button>
              ) : (
                <button onClick={async () => {
                  const r = window.prompt("Reason for hiding:"); if (!r) return;
                  await hideListingAdmin(adminCtx, "service", s.id, s.title, r);
                  setAllServices((prev) => prev.map((x) => x.id === s.id ? { ...x, adminHidden: true } : x));
                  toast.success("Hidden."); fetchAudit();
                }} className="rounded-lg bg-amber-900/40 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900/60">
                  <EyeOff size={12} className="inline" /> Hide
                </button>
              )}
              <button onClick={() => setDeleteListingModal({ kind: "service", id: s.id, title: s.title, ownerId: s.ownerId })}
                className="rounded-lg bg-red-900/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/60">
                <Trash2 size={12} className="inline" /> Delete
              </button>
            </div>
          </div>
        ))}
        {allServices.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-500">No services yet.</div>}
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeBigTab === "accommodation") {
      if (currentMiniTab === "properties") return (
        <PropertiesTab
          allProperties={allProperties} pendingProperties={pendingProperties}
          isFetchingProperties={isFetchingProperties} statsHiddenProperties={stats.hiddenProperties}
          propertyFilter={propertyFilter} onPropertyFilterChange={setPropertyFilter}
          boostSearchTerm={boostSearchTerm} onBoostSearchTermChange={setBoostSearchTerm}
          selectedPropertyIds={selectedPropertyIds} onToggleSelectProp={toggleSelectProp}
          onSelectAll={() => setSelectedPropertyIds(pendingProperties.map((p) => p.id))}
          onDeselectAll={() => setSelectedPropertyIds([])}
          isVerifying={isVerifying} isTogglingBoost={isTogglingBoost}
          onVerifyProperty={handleVerifyProperty} onToggleBoost={handleToggleBoost}
          onHideClick={(p) => setHideModal({ id: p.id, title: p.title, ownerId: p.ownerId })}
          onUnhide={handleUnhide} onBulkModal={(s) => setBulkModal({ status: s })}
        />
      );
      if (currentMiniTab === "bookings") return <BookingsTab allBookings={allBookings} onCancelClick={setCancelBookingModal} />;
      if (currentMiniTab === "payments") return (
        <PaymentsTab
          filteredBookings={filteredBookings} isFetching={isFetching} isSubmitting={isSubmitting}
          searchTerm={searchTerm} onSearchChange={setSearchTerm} agentFee={AGENT_FEE}
          boostedProperties={allProperties.filter((p) => isBoosted(p))}
          onMarkPaid={handleMarkPaid} onRefundClick={(id, title) => setRefundModal({ id, title })}
        />
      );
    }
    if (activeBigTab === "marketplace") {
      if (currentMiniTab === "shop") return (
        <ShopTab filteredProviders={filteredProviders} providerCounts={providerCounts}
          providerFilter={providerFilter} onProviderFilterChange={setProviderFilter}
          providerSearchTerm={providerSearchTerm} onProviderSearchTermChange={setProviderSearchTerm}
          isFetchingUsers={isFetchingUsers} busyProviderId={busyProviderId}
          onApprove={handleApproveProvider}
          onRejectClick={(p) => { setRejectProviderModal(p); setRejectReason(""); }}
          boostServices={allServices.filter((s) => s.boostRequested || isServiceBoosted(s))}
          boostProducts={allProducts.filter((p) => p.boostRequested || isProductBoosted(p))}
          busyBoostId={busyBoostId} onActivateBoost={handleActivateBoost} onDeactivateBoost={handleDeactivateBoost}
        />
      );
      if (currentMiniTab === "products") return renderProductsList();
      if (currentMiniTab === "services") return renderServicesList();
      if (currentMiniTab === "library") return <LibraryTab />;
    }
    if (activeBigTab === "control") {
      if (currentMiniTab === "comms") return (
        <CommsTab
          announceContent={announceContent} onAnnounceContentChange={setAnnounceContent}
          isActive={isActive} isUpdatingAnnounce={isUpdatingAnnounce} loadingAnnounce={loadingAnnounce}
          sendPush={sendPush} onSendPushChange={setSendPush}
          pushTarget={pushTarget} onPushTargetChange={setPushTarget}
          onPublishAnnounce={handlePublishAnnounce} onHideAnnounce={handleHideAnnounce}
          unansweredQuestions={unansweredQuestions} filteredQuestions={filteredQuestions}
          isFetchingQuestions={isFetchingQuestions} showResolved={showResolved}
          onShowResolvedChange={setShowResolved} isResolving={isResolving}
          onMarkResolved={handleMarkResolved}
        />
      );
      if (currentMiniTab === "ask-peza") return <AskPezaTab />; // ⭐ Added
      if (currentMiniTab === "articles") return <ArticlesTab />;
      if (currentMiniTab === "upgrades") return (
        <UpgradesTab users={directoryUsers} isFetching={isFetchingUsers} onUpgrade={requestUpdatePlan} />
      );
      if (currentMiniTab === "tools") return (
        <ToolsTab currentSiteMode={currentSiteMode} auditEntries={auditEntries}
          isFetchingAudit={isFetchingAudit} onOpenSiteModeModal={() => setSiteModeModal(true)}
          onRefreshAudit={fetchAudit}
        />
      );
      if (currentMiniTab === "security") return renderSecurityTab();
    }
    if (activeBigTab === "stats") {
      if (currentMiniTab === "overview") return renderStatsOverview();
      if (currentMiniTab === "traffic") return (
        <AnalyticsTab analytics={analytics} isFetchingAnalytics={isFetchingAnalytics}
          analyticsRange={analyticsRange} onAnalyticsRangeChange={setAnalyticsRange}
        />
      );
      if (currentMiniTab === "revenue") return renderRevenue();
    }
    if (activeBigTab === "people") {
      if (currentMiniTab === "users") return (
        <UsersTab 
          filteredUsers={filteredUsers} 
          isFetchingUsers={isFetchingUsers}
          userSearchTerm={userSearchTerm} 
          onUserSearchTermChange={setUserSearchTerm}
          userRoleFilter={userRoleFilter} 
          onUserRoleFilterChange={setUserRoleFilter}
          userUniversityFilter={userUniversityFilter}
          onUserUniversityFilterChange={setUserUniversityFilter}
          userStatusFilter={userStatusFilter}
          onUserStatusFilterChange={setUserStatusFilter}
          onOpenProfile={openUserProfile}
          onDirectMessage={(u) => setDmModal({ uid: u.uid, name: u.fullName || u.email })}
          onEmail={(u) => setEmailModal({ email: u.email, name: u.fullName || u.email })}
          onSuspendToggle={(u) => setSuspendModal({ uid: u.uid, name: u.fullName || u.email, currentlySuspended: !!u.suspended })}
        />
      );
      if (currentMiniTab === "reports") return (
        <ReportsTab reports={reports} isFetchingReports={isFetchingReports}
          busyReportId={busyReportId} onTakeDown={handleTakeDownReport} onDismiss={handleDismissReport}
        />
      );
    }
    return null;
  };

  const big = BIG_TABS.find((t) => t.id === activeBigTab)!;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <div className="sticky top-0 z-30 border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
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
                  READ-ONLY
                </span>
              )}
              <button onClick={() => { fetchAllData(); fetchAudit(); fetchAnalytics(); fetchReports(); fetchLive(); hasMasterPin().then(setMasterPinSet); }}
                className="rounded-lg bg-gray-800 p-2 text-gray-300 hover:bg-gray-700" title="Refresh">
                <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
              </button>
              <button onClick={handlePurgeCache} disabled={isPurging}
                className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                title="Clear cached pages so users see the latest version">
                <Zap size={12} className={`inline mr-1 ${isPurging ? "animate-pulse" : ""}`} />
                {isPurging ? "Purging..." : "Purge Cache"}
              </button>
              <Link href="/" className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-700">
                View Site
              </Link>
              <button onClick={requestChangeAdminPassword}
                className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-700">
                <Key size={12} className="inline mr-1" /> Change Password
              </button>
              <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">v4.2</span>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {BIG_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeBigTab === tab.id;
              return (
                <button key={tab.id}
                  onClick={() => setActiveBigTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                    active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}>
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 overflow-x-auto mt-2 pb-1 border-t border-gray-800 pt-2">
            {big.mini.map((m) => (
              <button key={m.id}
                onClick={() => setActiveMiniTab((prev) => ({ ...prev, [activeBigTab]: m.id }))}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  currentMiniTab === m.id ? "bg-gray-700 text-white" : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 rounded-xl bg-red-900/30 border border-red-800 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}
        {needsPasswordSetup && (
          <div className="mb-6 rounded-xl bg-amber-900/30 border border-amber-800 p-4 text-sm text-amber-300">
            <strong>Security notice:</strong> You are still using the legacy PIN. Click "Change Password" above to set a real password.
          </div>
        )}
        {!masterPinSet && (
          <div className="mb-6 rounded-xl bg-red-900/30 border border-red-800 p-4 text-sm text-red-300">
            <strong>Master PIN not set.</strong> Destructive actions (delete, suspend, change plan, refund, cancel, change password) are locked.{" "}
            <button onClick={() => setShowSetMasterPinModal(true)} className="underline font-semibold">Set now →</button>
          </div>
        )}

        {renderContent()}
      </div>

      {hideModal && (
        <HidePropertyModal propertyTitle={hideModal.title}
          onClose={() => setHideModal(null)} onConfirm={confirmHide} />
      )}
      {refundModal && (
        <RefundBoostModal propertyTitle={refundModal.title}
          onClose={() => setRefundModal(null)} onConfirm={requestRefund} />
      )}
      {suspendModal && (
        <SuspendUserModal userName={suspendModal.name}
          onClose={() => setSuspendModal(null)} onConfirm={requestSuspend} />
      )}
      {cancelBookingModal && (
        <CancelBookingModal bookingLabel={`${cancelBookingModal.propertyTitle} — ${cancelBookingModal.studentName}`}
          onClose={() => setCancelBookingModal(null)} onConfirm={requestCancelBooking} />
      )}
      {dmModal && (
        <DirectMessageModal userName={dmModal.name}
          onClose={() => setDmModal(null)} onConfirm={confirmDirectMessage} />
      )}
      {emailModal && (
        <SendEmailModal toEmail={emailModal.email}
          onClose={() => setEmailModal(null)} onConfirm={confirmEmail} />
      )}
      {siteModeModal && (
        <SiteModeModal currentMode={currentSiteMode}
          onClose={() => setSiteModeModal(false)} onConfirm={confirmSiteMode} />
      )}
      {profileModal && (
        <ViewUserProfileModal profile={profileModal} loading={profileLoading}
          onClose={() => setProfileModal(null)}
          onDirectMessage={() => setDmModal({ uid: profileModal.uid, name: profileModal.fullName || profileModal.email })}
          onSendEmail={() => setEmailModal({ email: profileModal.email, name: profileModal.fullName || profileModal.email })}
          onToggleSuspend={() => setSuspendModal({ uid: profileModal.uid, name: profileModal.fullName || profileModal.email, currentlySuspended: !!profileModal.suspended })}
          onForcePasswordReset={requestForcePasswordReset}
        />
      )}
      {bulkModal && (
        <BulkVerifyModal count={selectedPropertyIds.length} status={bulkModal.status}
          onClose={() => setBulkModal(null)} onConfirm={confirmBulk} />
      )}
      {showChangePasswordModal && (
        <ChangeAdminPasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => setNeedsPasswordSetup(false)} />
      )}
      {showSetMasterPinModal && (
        <SetMasterPinModal
          onClose={() => setShowSetMasterPinModal(false)}
          onSuccess={() => { setShowSetMasterPinModal(false); hasMasterPin().then(setMasterPinSet); }}
        />
      )}
      {masterPrompt && (
        <MasterPinModal
          title={masterPrompt.title}
          description={masterPrompt.description}
          onClose={() => setMasterPrompt(null)}
          onSuccess={masterPrompt.onConfirm}
        />
      )}

      {rejectProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => { if (busyProviderId) return; setRejectProviderModal(null); setRejectReason(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white">
              {rejectProviderModal.verificationStatus === "approved" ? "Revoke approval?" : "Reject provider?"}
            </h3>
            <p className="mt-1 text-xs text-gray-400">{rejectProviderModal.businessName || rejectProviderModal.fullName || rejectProviderModal.email}</p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Reason (shown to provider)</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                placeholder="Explain why"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500" autoFocus />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setRejectProviderModal(null); setRejectReason(""); }} disabled={!!busyProviderId}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50">Cancel</button>
              <button onClick={handleRejectProvider} disabled={!!busyProviderId || !rejectReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {busyProviderId ? "Processing..." : rejectProviderModal.verificationStatus === "approved" ? "Revoke" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => { setDeleteListingModal(null); setDeleteReason(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-red-400">Delete "{deleteListingModal.title}"?</h3>
            <p className="mt-1 text-xs text-gray-400">This permanently removes the listing. You'll need to enter the master PIN next.</p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Reason (shown to owner)</label>
              <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3}
                placeholder="e.g. Violates community guidelines"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500" autoFocus />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setDeleteListingModal(null); setDeleteReason(""); }}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={requestDeleteListing} disabled={!deleteReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                Continue to PIN →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}