"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, Search, Home, Calendar, DollarSign, Megaphone, Star,
  RefreshCw, LayoutGrid, CreditCard, Users, Building,
  BarChart3, Settings, Wrench, Mail, Ban, Trash2,
  ScrollText, Store, ShoppingBag,
  Shield, AlertTriangle, Flag,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { getAllApprovedBookings, updateBookingStatus } from "@/services/bookingService";
import { getAnnouncement, updateAnnouncement } from "@/services/announcementService";
import { getAllProperties, updateProperty } from "@/services/propertyService";
import { getAllServices, updateService } from "@/services/serviceService";
import { getAllProducts, updateProduct } from "@/services/productService";
import {
  collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { Service, isServiceBoosted, BOOST_TIERS } from "@/types/service";
import { Product, isProductBoosted } from "@/types/product";
import { isBoosted } from "@/lib/boostService";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { createNotification } from "@/services/notificationService";
import {
  hideProperty, unhideProperty, bulkVerifyProperties,
  suspendUser, unsuspendUser, refundBoost,
  cancelBooking as cancelBookingAction,
  setSiteMode, getSiteMode, sendDirectMessage,
  SiteMode,
} from "@/services/adminActionsService";
import { getRecentAuditEntries, AuditEntry } from "@/services/auditLogService";
import { getAllReports, updateReportStatus } from "@/services/reportService";
import type { Report } from "@/types/report";
import {
  HidePropertyModal, RefundBoostModal, SuspendUserModal,
  CancelBookingModal, DirectMessageModal, SendEmailModal,
  SiteModeModal, ViewUserProfileModal, BulkVerifyModal,
  UserProfileData,
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
import type { AdminTab, DirectoryUser, UnansweredQuestion, AdminStats } from "@/components/admin/types";

const AGENT_FEE = 100;
const BOOST_FEE = 100;
const ADMIN_PIN = "3542";

const TABS: { id: AdminTab; label: string; icon: typeof LayoutGrid; color: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, color: "text-blue-400" },
  { id: "payments", label: "Payments", icon: DollarSign, color: "text-green-400" },
  { id: "properties", label: "Properties", icon: Home, color: "text-cyan-400" },
  { id: "users", label: "Users", icon: Users, color: "text-purple-400" },
  { id: "shop", label: "Shop", icon: Store, color: "text-emerald-400" },
  { id: "bookings", label: "Bookings", icon: Calendar, color: "text-orange-400" },
  { id: "comms", label: "Comms", icon: Megaphone, color: "text-pink-400" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-yellow-400" },
  { id: "reports", label: "Reports", icon: Flag, color: "text-red-400" },
  { id: "tools", label: "Tools", icon: Wrench, color: "text-red-400" },
];

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

      const servicesRef = collection(db, "services");
      const productsRef = collection(db, "products");
      const [servicesSnap, productsSnap] = await Promise.all([
        getDocs(servicesRef),
        getDocs(productsRef),
      ]);
      setAllServices(
        servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Service))
      );
      setAllProducts(
        productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
      );

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

  const fetchReports = async () => {
    setIsFetchingReports(true);
    try {
      const data = await getAllReports();
      setReports(data);
    } finally {
      setIsFetchingReports(false);
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
      fetchReports();
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
      const notifTitle = isApproved ? "Your listing is live! 🎉" : "Listing needs changes";
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
      } catch { /* silent */ }

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
      } catch { /* silent */ }

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
      } catch { /* silent */ }

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

  // ─── Boost handlers for services/products ───
  const handleActivateBoost = async (
    kind: "service" | "product",
    id: string,
    title: string,
    ownerId: string
  ) => {
    setBusyBoostId(id);
    try {
      const now = Date.now();

      const source = kind === "service"
        ? allServices.find((s) => s.id === id)
        : allProducts.find((p) => p.id === id);
      const requestedDuration = (source as any)?.boostRequestedDuration as
        | "daily"
        | "weekly"
        | "monthly"
        | undefined;
      const requestedAmount = (source as any)?.boostRequestedAmount as
        | number
        | undefined;

      const tier =
        BOOST_TIERS.find((t) => t.id === requestedDuration) ||
        BOOST_TIERS.find((t) => t.id === "weekly")!;

      const updateData: any = {
        isBoosted: true,
        boostedAt: now,
        boostExpiry: now + tier.ms,
        boostRequested: false,
        boostRequestedDuration: null,
        boostRequestedAmount: null,
      };

      if (kind === "service") {
        await updateService(id, updateData as any);
        setAllServices((prev) =>
          prev.map((s) =>
            s.id === id ? ({ ...s, ...updateData } as Service) : s
          )
        );
      } else {
        await updateProduct(id, updateData as any);
        setAllProducts((prev) =>
          prev.map((p) =>
            p.id === id ? ({ ...p, ...updateData } as Product) : p
          )
        );
      }

      try {
        const amountLabel = requestedAmount
          ? `K${requestedAmount.toFixed(2)}`
          : `K${tier.amount.toFixed(2)}`;
        await createNotification(ownerId, {
          title: "Your listing is boosted! ⚡",
          body: `"${title}" is now featured at the top for ${tier.label.toLowerCase()} (${amountLabel}).`,
          type: "announcement",
          link: "/dashboard/provider",
        });
        await sendPushNotification({
          userId: ownerId,
          title: "Your listing is boosted! ⚡",
          body: `"${title}" is now featured at the top for ${tier.label.toLowerCase()}.`,
          url: "/dashboard/provider",
        });
      } catch { /* silent */ }

      toast.success(`Boost activated for "${title}" · ${tier.label}`);
      fetchAudit();
    } catch {
      toast.error("Failed to activate boost.");
    } finally {
      setBusyBoostId(null);
    }
  };

  const handleDeactivateBoost = async (
    kind: "service" | "product",
    id: string,
    title: string
  ) => {
    setBusyBoostId(id);
    try {
      const updateData = { isBoosted: false, boostExpiry: null };

      if (kind === "service") {
        await updateService(id, updateData);
        setAllServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updateData } : s))
        );
      } else {
        await updateProduct(id, updateData);
        setAllProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updateData } : p))
        );
      }

      toast.success(`Boost removed from "${title}"`);
      fetchAudit();
    } catch {
      toast.error("Failed to remove boost.");
    } finally {
      setBusyBoostId(null);
    }
  };

  // ─── Report handlers ───
  const handleTakeDownReport = async (report: Report) => {
    setBusyReportId(report.id);
    try {
      if (report.targetType === "service") {
        await updateService(report.targetId, {
          adminHidden: true,
          adminHiddenReason: `Reported: ${report.reason}`,
        });
        setAllServices((prev) =>
          prev.map((s) =>
            s.id === report.targetId
              ? { ...s, adminHidden: true, adminHiddenReason: `Reported: ${report.reason}` }
              : s
          )
        );
      } else {
        await updateProduct(report.targetId, {
          adminHidden: true,
          adminHiddenReason: `Reported: ${report.reason}`,
        });
        setAllProducts((prev) =>
          prev.map((p) =>
            p.id === report.targetId
              ? { ...p, adminHidden: true, adminHiddenReason: `Reported: ${report.reason}` }
              : p
          )
        );
      }

      await updateReportStatus(report.id, "resolved", adminCtx.adminEmail);
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, status: "resolved", reviewedAt: Date.now(), reviewedBy: adminCtx.adminEmail }
            : r
        )
      );

      toast.success("Listing taken down.");
      fetchAudit();
    } catch {
      toast.error("Failed to take down listing.");
    } finally {
      setBusyReportId(null);
    }
  };

  const handleDismissReport = async (report: Report) => {
    setBusyReportId(report.id);
    try {
      await updateReportStatus(report.id, "dismissed", adminCtx.adminEmail);
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, status: "dismissed", reviewedAt: Date.now(), reviewedBy: adminCtx.adminEmail }
            : r
        )
      );
      toast.success("Report dismissed.");
      fetchAudit();
    } catch {
      toast.error("Failed to dismiss report.");
    } finally {
      setBusyReportId(null);
    }
  };

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
                onClick={() => { fetchAllData(); fetchAudit(); fetchAnalytics(); fetchReports(); }}
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
          <DashboardTab
            stats={stats}
            providerPendingCount={providerCounts.pending}
            auditEntries={auditEntries}
            statsReset={statsReset}
            onShowStats={handleShowStats}
            onResetStats={handleResetStats}
            onGoToTab={setActiveTab}
          />
        )}

        {activeTab === "payments" && (
          <PaymentsTab
            filteredBookings={filteredBookings}
            isFetching={isFetching}
            isSubmitting={isSubmitting}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            agentFee={AGENT_FEE}
            boostedProperties={allProperties.filter((p) => isBoosted(p))}
            onMarkPaid={handleMarkPaid}
            onRefundClick={(id, title) => setRefundModal({ id, title })}
          />
        )}

        {activeTab === "properties" && (
          <PropertiesTab
            allProperties={allProperties}
            pendingProperties={pendingProperties}
            isFetchingProperties={isFetchingProperties}
            statsHiddenProperties={stats.hiddenProperties}
            propertyFilter={propertyFilter}
            onPropertyFilterChange={setPropertyFilter}
            boostSearchTerm={boostSearchTerm}
            onBoostSearchTermChange={setBoostSearchTerm}
            selectedPropertyIds={selectedPropertyIds}
            onToggleSelectProp={toggleSelectProp}
            onSelectAll={() => setSelectedPropertyIds(pendingProperties.map((p) => p.id))}
            onDeselectAll={() => setSelectedPropertyIds([])}
            isVerifying={isVerifying}
            isTogglingBoost={isTogglingBoost}
            onVerifyProperty={handleVerifyProperty}
            onToggleBoost={handleToggleBoost}
            onHideClick={(property) =>
              setHideModal({
                id: property.id,
                title: property.title,
                ownerId: property.ownerId,
              })
            }
            onUnhide={handleUnhide}
            onBulkModal={(status) => setBulkModal({ status })}
          />
        )}

        {activeTab === "users" && (
          <UsersTab
            filteredUsers={filteredUsers}
            isFetchingUsers={isFetchingUsers}
            userSearchTerm={userSearchTerm}
            onUserSearchTermChange={setUserSearchTerm}
            userRoleFilter={userRoleFilter}
            onUserRoleFilterChange={setUserRoleFilter}
            onOpenProfile={openUserProfile}
            onDirectMessage={(u) =>
              setDmModal({ uid: u.uid, name: u.fullName || u.email })
            }
            onEmail={(u) =>
              setEmailModal({ email: u.email, name: u.fullName || u.email })
            }
            onSuspendToggle={(u) =>
              setSuspendModal({
                uid: u.uid,
                name: u.fullName || u.email,
                currentlySuspended: !!u.suspended,
              })
            }
          />
        )}

        {activeTab === "shop" && (
          <ShopTab
            filteredProviders={filteredProviders}
            providerCounts={providerCounts}
            providerFilter={providerFilter}
            onProviderFilterChange={setProviderFilter}
            providerSearchTerm={providerSearchTerm}
            onProviderSearchTermChange={setProviderSearchTerm}
            isFetchingUsers={isFetchingUsers}
            busyProviderId={busyProviderId}
            onApprove={handleApproveProvider}
            onRejectClick={(p) => {
              setRejectProviderModal(p);
              setRejectReason("");
            }}
            boostServices={allServices.filter(
              (s) => s.boostRequested || isServiceBoosted(s)
            )}
            boostProducts={allProducts.filter(
              (p) => p.boostRequested || isProductBoosted(p)
            )}
            busyBoostId={busyBoostId}
            onActivateBoost={handleActivateBoost}
            onDeactivateBoost={handleDeactivateBoost}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsTab
            allBookings={allBookings}
            onCancelClick={setCancelBookingModal}
          />
        )}

        {activeTab === "comms" && (
          <CommsTab
            announceContent={announceContent}
            onAnnounceContentChange={setAnnounceContent}
            isActive={isActive}
            isUpdatingAnnounce={isUpdatingAnnounce}
            loadingAnnounce={loadingAnnounce}
            sendPush={sendPush}
            onSendPushChange={setSendPush}
            pushTarget={pushTarget}
            onPushTargetChange={setPushTarget}
            onPublishAnnounce={handlePublishAnnounce}
            onHideAnnounce={handleHideAnnounce}
            unansweredQuestions={unansweredQuestions}
            filteredQuestions={filteredQuestions}
            isFetchingQuestions={isFetchingQuestions}
            showResolved={showResolved}
            onShowResolvedChange={setShowResolved}
            isResolving={isResolving}
            onMarkResolved={handleMarkResolved}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab
            analytics={analytics}
            isFetchingAnalytics={isFetchingAnalytics}
            analyticsRange={analyticsRange}
            onAnalyticsRangeChange={setAnalyticsRange}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            reports={reports}
            isFetchingReports={isFetchingReports}
            busyReportId={busyReportId}
            onTakeDown={handleTakeDownReport}
            onDismiss={handleDismissReport}
          />
        )}

        {activeTab === "tools" && (
          <ToolsTab
            currentSiteMode={currentSiteMode}
            auditEntries={auditEntries}
            isFetchingAudit={isFetchingAudit}
            onOpenSiteModeModal={() => setSiteModeModal(true)}
            onRefreshAudit={fetchAudit}
          />
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