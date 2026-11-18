// src/app/dashboard/student/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Home, Trash2, Info, MapPin, Ticket, ArrowRight, Bed, CreditCard, 
  Sparkles, CalendarDays, Clock, CheckCircle2, XCircle 
} from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPropertyById } from "@/services/propertyService";
import { deleteBooking, expireExpiredBookings } from "@/services/bookingService";
import { getStudentAppointments } from "@/services/appointmentService";
import { useBookingListener } from "@/hooks/useBookingListener";
import { useBookingConfirmationCelebration } from "@/hooks/useBookingConfirmationCelebration";
import { Booking } from "@/types/booking";
import { Property } from "@/types/property";
import { Appointment } from "@/types/appointment";
import { BackButton } from "@/components/ui/BackButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { TermsModal } from "@/components/auth/TermsModal";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { BookingCountdown } from "@/components/BookingCountdown";
import { ConfirmationCelebration } from "@/components/ConfirmationCelebration";
import { PostBookingChecklist } from "@/components/PostBookingChecklist";
import { PaymentInstructionsModal } from "@/components/PaymentInstructionsModal";
import { CampusMatchPrompt } from "@/components/campus-match/CampusMatchPrompt";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

const PAYMENT_NUMBER = "+260 0771319817";

function statusMessage(booking: Booking) {
  if (!booking || !booking.status) return { text: "Status unknown", color: "var(--nexora-text-secondary)" };
  if (booking.status === "requested") return { text: "Waiting for landlord approval", color: "var(--nexora-warning)" };
  if (booking.status === "approved") return { text: `Pay K100 agent fee to ${PAYMENT_NUMBER} to confirm your booking`, color: "var(--nexora-primary)" };
  if (booking.status === "rejected") return { text: "Request rejected by landlord", color: "var(--nexora-danger)" };
  if (booking.status === "expired") return { text: "Approval expired", color: "var(--nexora-danger)" };
  return { text: "Booking confirmed!", color: "var(--nexora-success)" };
}

function getBadgeStyles(status: string | undefined) {
  if (!status) return "bg-gray-100 text-gray-500";
  switch (status) {
    case "requested": return "bg-yellow-100 text-yellow-800";
    case "approved": return "bg-blue-100 text-blue-800";
    case "confirmed": return "bg-green-100 text-green-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "expired": return "bg-gray-100 text-gray-500";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getStatusDisplayName(status: string | undefined) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function StudentDashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const userLocation = useGeolocation();

  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookingListener();
  const { justConfirmed, dismiss } = useBookingConfirmationCelebration();

  const [propertyMap, setPropertyMap] = useState<Record<string, Property>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [isFetchingProperties, setIsFetchingProperties] = useState(true);
  const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null);

  // ⭐ Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isFetchingAppts, setIsFetchingAppts] = useState(true);

  // ─── Fetch user data and expire bookings ──────────────────
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.fullName) setUserFullName(data.fullName);
          if (data?.hasAcceptedTerms === false) setShowTermsModal(true);
        }
      } catch {}
    };
    fetchUserData();

    const checkExpired = async () => {
      try { await expireExpiredBookings(user.uid); } catch {}
    };
    checkExpired();

    // ⭐ Fetch Appointments
    const fetchAppts = async () => {
      try {
        const data = await getStudentAppointments(user.uid);
        setAppointments(data);
      } catch {
        // silent
      } finally {
        setIsFetchingAppts(false);
      }
    };
    fetchAppts();
  }, [user]);

  // ─── Fetch property details for map ─────────────────────────
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

  async function handleDelete(bookingId: string) {
    if (!window.confirm("Remove this confirmed booking from your history?")) return;
    try {
      await deleteBooking(bookingId);
      toast.success("Booking removed successfully.");
    } catch { toast.error("Failed to delete booking. Please try again."); }
  }

  function goToBrowse() { router.push("/"); }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const isFetching = bookingsLoading || isFetchingProperties;
  const validBookings = bookings.filter((b) => b && b.status);

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4"><BackButton /></div>

        {/* ─── Header ─── */}
        <div className="card-premium p-6 bg-[var(--nexora-navy)] text-white">
          <p className="text-sm text-gray-300">Welcome back</p>
          <h1 className="mt-1 text-xl font-bold">{userFullName || user.email}</h1>
          {userFullName && <p className="mt-0.5 text-xs text-gray-400">{user.email}</p>}
        </div>

        <div className="mt-6"><CampusMatchPrompt user={user} /></div>

        {/* ─── BIG BROWSE BUTTON ─── */}
        <div className="mt-6">
          <button onClick={goToBrowse} className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-white text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white"><Bed size={24} /></div>
              <div className="flex-1">
                <p className="text-lg font-bold">Find Your Perfect Room</p>
                <p className="text-sm text-white/80">Browse all available properties near your campus</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"><ArrowRight size={20} /></div>
            </div>
          </button>
        </div>

        {/* ─── ASK PEZA CONCIERGE CARD ─── */}
        <div className="mt-4">
          <button onClick={() => window.dispatchEvent(new CustomEvent("openAskPeza"))} className="group w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-1 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]">
            <div className="flex items-center gap-4 rounded-xl bg-black/10 p-4 text-left backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm ring-4 ring-white/10 group-hover:ring-white/30 transition-all">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white flex items-center gap-2">Ask Peza Concierge <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">New</span></p>
                <p className="text-xs text-white/90">Looking for a specific book, gadget, or service? We'll find it for you.</p>
              </div>
              <ArrowRight size={18} className="text-white/70 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        <div className="mt-6"><NotificationOptIn variant="banner" /></div>

        {bookingsError && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">Failed to load bookings. Please refresh.</div>
        )}

        {/* ─── SERVICE APPOINTMENTS ─── */}
        {!isFetchingAppts && appointments.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)] flex items-center gap-2">
              <CalendarDays size={20} className="text-indigo-500" />
              My Service Appointments
              <span className="ml-2 text-sm font-normal text-gray-400">({appointments.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {appointments.map((apt) => (
                <div key={apt.id} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900">{apt.serviceTitle}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                      apt.status === "pending" ? "bg-amber-100 text-amber-700" :
                      apt.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {apt.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {apt.time}</span>
                  </div>
                  {apt.status === "confirmed" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
                      <CheckCircle2 size={12} /> Confirmed! The provider will contact you.
                    </div>
                  )}
                  {apt.status === "pending" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                      <Clock size={12} /> Waiting for provider to confirm.
                    </div>
                  )}
                  {apt.status === "cancelled" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-800">
                      <XCircle size={12} /> The provider could not make this time.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ACCOMMODATION BOOKINGS ─── */}
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
            My Accommodation Bookings <span className="ml-2 text-sm font-normal text-gray-400">({validBookings.length})</span>
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
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]"><Home size={28} /></div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">No bookings yet</p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">Discover verified accommodation near your campus.</p>
              <button onClick={goToBrowse} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]">
                <Home size={16} /> Browse Properties →
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
                <Info size={16} className="shrink-0 mt-0.5 text-gray-400" />
                <span>You can only remove <strong className="text-gray-500">confirmed</strong> bookings from your history.</span>
              </div>
              <div className="space-y-4">
                {validBookings.map((booking) => {
                  const status = statusMessage(booking);
                  const property = propertyMap[booking.propertyId];
                  const hasCoordinates = property?.latitude !== undefined && property?.longitude !== undefined;
                  const isConfirmed = booking.status === "confirmed";
                  const isApproved = booking.status === "approved";
                  const isExpired = booking.status === "expired";

                  const defaultCenter: [number, number] =
                    userLocation.latitude && userLocation.longitude ? [userLocation.latitude, userLocation.longitude]
                    : hasCoordinates ? [property!.latitude!, property!.longitude!]
                    : [-15.3875, 28.3228];

                  return (
                    <div key={booking.id} className={`rounded-2xl bg-white p-4 shadow-sm ${isExpired ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{booking.propertyTitle}</p>
                          <p className="text-xs text-gray-500">K{booking.price.toLocaleString()}/{booking.paymentPeriod === "termly" ? "term" : "month"}</p>
                          {isApproved && <BookingCountdown booking={booking} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeStyles(booking.status)}`}>{getStatusDisplayName(booking.status)}</span>
                          {isConfirmed && (
                            <button onClick={() => handleDelete(booking.id)} className="rounded-full p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Delete booking" title="Remove this confirmed booking from your history"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs font-medium" style={{ color: status.color }}>{status.text}</p>

                      {isApproved && (
                        <div className="mt-2 rounded-md border-l-4 border-[var(--nexora-primary)] bg-blue-50 px-3 py-2.5">
                          <p className="text-xs text-blue-800"><span className="font-semibold">Action Required:</span> {status.text}</p>
                          <button onClick={() => setPayModalBooking(booking)} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"><CreditCard size={14} /> Pay K100 Now</button>
                        </div>
                      )}
                      {isExpired && <div className="mt-2 rounded-md border-l-4 border-gray-400 bg-gray-50 px-3 py-2 text-xs text-gray-500">This approval has expired. The bed is now available again.</div>}
                      {isConfirmed && (
                        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                          <Link href={`/booking/confirmation/${booking.id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-200"><Ticket size={14} /> View Your Booking Pass →</Link>
                        </div>
                      )}
                      {isConfirmed && <PostBookingChecklist booking={booking} />}
                      {isConfirmed && hasCoordinates && property && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1"><MapPin size={14} className="text-[var(--nexora-primary)]" /> Property Location</span>
                            <a href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--nexora-primary)] hover:underline">Open Directions ↗</a>
                          </div>
                          <PropertyMap latitude={property.latitude} longitude={property.longitude} height="clamp(150px, 25vw, 250px)" selectable={false} defaultCenter={defaultCenter} showSearch={false} showMyLocation={false} showUserDistance={true} showCoordinateBadge={false} userLocation={userLocation.latitude && userLocation.longitude ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null} />
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

      <ConfirmationCelebration booking={justConfirmed} onDismiss={dismiss} />
      {showTermsModal && user && <TermsModal userId={user.uid} onAccept={() => setShowTermsModal(false)} />}
      {payModalBooking && <PaymentInstructionsModal isOpen={!!payModalBooking} onClose={() => setPayModalBooking(null)} booking={payModalBooking} />}
    </main>
  );
}