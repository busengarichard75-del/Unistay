"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { BackButton } from "@/components/ui/BackButton";
import { getUniversityFullName } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import {
  getPropertyById,
  deleteProperty,
  updateProperty,
} from "@/services/propertyService";
import { getBookingsForLandlord } from "@/services/bookingService";
import { isBoosted, getBoostDaysRemaining } from "@/lib/boostService";
import { Property } from "@/types/property";
import { Booking } from "@/types/booking";
import {
  Eye,
  Users,
  Check,
  Zap,
  Star,
  MapPin,
  Pencil,
  Trash2,
  ExternalLink,
  EyeOff,
  Eye as EyeIcon,
  Bed,
  Home,
  XCircle,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle as XIcon,
  Droplet,
  Bolt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const PERIOD_LABEL: Record<string, string> = {
  monthly: "/mo",
  termly: "/term",
  semester: "/semester",
};

const DISTANCE_LABEL: Record<string, string> = {
  under5: "Under 5 min walk",
  "5to15": "5 – 15 min walk",
  "15to30": "15 – 30 min walk",
  over30: "30+ min walk",
};

const GENDER_LABEL: Record<string, string> = {
  male: "Male only",
  female: "Female only",
  mixed: "Mixed",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LandlordListingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  // Boost modal (inline, K100 — matches dashboard)
  const [boostModalOpen, setBoostModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const [prop, allBookings] = await Promise.all([
          getPropertyById(id),
          getBookingsForLandlord(user.uid),
        ]);
        if (!active) return;

        if (!prop || prop.ownerId !== user.uid) {
          setNotFound(true);
        } else {
          setProperty(prop);
          setBookings(
            allBookings.filter((b) => b.propertyId === id)
          );
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user, id]);

  async function handleDelete() {
    if (!property) return;
    if (!window.confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteProperty(id);
      toast.success("Listing deleted.");
      router.push("/dashboard/landlord");
    } catch {
      toast.error("Failed to delete listing.");
      setBusy(false);
    }
  }

  async function handleToggleActive() {
    if (!property) return;
    setBusy(true);
    try {
      const next = !(property.isActive !== false);
      await updateProperty(id, { isActive: next });
      setProperty({ ...property, isActive: next });
      toast.success(next ? "Listing activated." : "Listing deactivated.");
    } catch {
      toast.error("Failed to update listing status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleBed(bedId: string, roomIndex?: number) {
    if (!property) return;
    setBusy(true);
    try {
      let updatedProperty = { ...property };

      if (property.rooms && property.rooms.length > 0) {
        const updatedRooms = property.rooms.map((room, idx) => {
          if (roomIndex !== undefined && idx === roomIndex) {
            const beds = room.bedSpaces.map((bed) =>
              bed.id === bedId ? { ...bed, isAvailable: !bed.isAvailable } : bed
            );
            return { ...room, bedSpaces: beds };
          }
          return room;
        });
        updatedProperty.rooms = updatedRooms;
        updatedProperty.bedSpaces = updatedRooms.flatMap((r) => r.bedSpaces);
      } else {
        const beds = (property.bedSpaces || []).map((bed) =>
          bed.id === bedId ? { ...bed, isAvailable: !bed.isAvailable } : bed
        );
        updatedProperty.bedSpaces = beds;
      }

      await updateProperty(id, {
        bedSpaces: updatedProperty.bedSpaces,
        rooms: updatedProperty.rooms,
      });
      setProperty(updatedProperty);
      toast.success("Bed space updated.");
    } catch {
      toast.error("Failed to update occupancy.");
    } finally {
      setBusy(false);
    }
  }

  // ── Loading ──
  if (authLoading || isFetching) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
        <div className="container-medium">
          <BackButton />
          <div className="mt-6 animate-pulse space-y-4">
            <div className="h-64 rounded-2xl bg-white shadow-sm" />
            <div className="h-32 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  // ── Not found ──
  if (notFound || !property) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
        <div className="container-medium">
          <BackButton />
          <div className="card-premium mt-6 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <ArrowLeft size={28} />
            </div>
            <p className="text-sm font-medium text-gray-900">Listing not found</p>
            <p className="mt-1 text-xs text-gray-500">
              It may have been deleted or belongs to another account.
            </p>
            <Link
              href="/dashboard/landlord"
              className="mt-4 inline-flex items-center rounded-full bg-[var(--nexora-primary)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Derived ──
  const primaryImage = property.imageUrls?.[0] || property.imageUrl || null;
  const boosted = isBoosted(property);
  const boostDays = boosted ? getBoostDaysRemaining(property) : 0;
  const isActive = property.isActive !== false;
  const isVerified = property.verificationStatus === "approved";
  const isPending = property.verificationStatus === "pending";
  const isRejected = property.verificationStatus === "rejected";

  const beds = property.bedSpaces ?? [];
  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => b.isAvailable).length;
  const occupiedBeds = totalBeds - availableBeds;

  const totalRequests = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "requested").length;

  const periodLabel = property.paymentPeriod
    ? PERIOD_LABEL[property.paymentPeriod] || ""
    : "";

  const distanceLabel = property.distanceBucket
    ? DISTANCE_LABEL[property.distanceBucket]
    : null;

  const genderLabel = property.genderPreference
    ? GENDER_LABEL[property.genderPreference]
    : null;

  const uniName = property.universityId
    ? getUniversityFullName(property.universityId)
    : null;

  const publicHref = `/property/${property.id}`;

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6 pb-24">
      <div className="container-medium">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ─── HERO ─── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <Home size={48} strokeWidth={1.5} />
              </div>
            )}

            {/* Top-left: verification */}
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  ✅ Verified
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                  ⏳ Pending
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  ❌ Rejected
                </span>
              )}
            </div>

            {/* Top-right: boost / status */}
            <div className="absolute right-3 top-3 flex flex-wrap items-center gap-2">
              {boosted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                  <Star size={12} fill="currentColor" />
                  Boosted · {boostDays}d left
                </span>
              )}
            </div>

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                <span className="rounded-full bg-gray-900/90 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white">
                  Deactivated
                </span>
              </div>
            )}
          </div>

          {/* Header content */}
          <div className="p-5">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {property.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {property.location}
              </span>
              {uniName && <span>{uniName}</span>}
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold text-[var(--nexora-navy)]">
                K{property.price.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-gray-500">
                  {periodLabel}
                </span>
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  availableBeds === 0
                    ? "bg-red-50 text-red-600"
                    : availableBeds <= 2
                    ? "bg-amber-50 text-amber-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                <Bed size={12} />
                {availableBeds === 0
                  ? "Full"
                  : `${availableBeds} of ${totalBeds} available`}
              </span>
            </div>
          </div>
        </div>

        {/* ─── PERFORMANCE ─── */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Performance
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PerfCard
              icon={Eye}
              label="Views"
              value={property.views || 0}
              accent="blue"
            />
            <PerfCard
              icon={Users}
              label="Booking requests"
              value={totalRequests}
              accent="amber"
            />
            <PerfCard
              icon={CheckCircle2}
              label="Confirmed"
              value={confirmedCount}
              accent="green"
            />
            <PerfCard
              icon={Clock}
              label="Pending"
              value={pendingCount}
              accent="amber"
            />
          </div>
        </div>

        {/* ─── ROOM / BED BREAKDOWN ─── */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            <Bed size={14} />
            Bed Spaces
            <span className="ml-auto text-xs font-normal normal-case text-gray-500">
              {availableBeds} / {totalBeds} available
            </span>
          </h2>

          {totalBeds === 0 ? (
            <p className="text-sm text-gray-500">No beds configured yet.</p>
          ) : property.rooms && property.rooms.length > 0 ? (
            <div className="space-y-3">
              {property.rooms.map((room, roomIndex) => (
                <div key={room.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {room.name}
                  </p>
                  <div className="space-y-1.5">
                    {room.bedSpaces.map((bed) => (
                      <div
                        key={bed.id}
                        className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm"
                      >
                        <span className="text-xs text-gray-700">
                          {bed.type || "Standard"}{" "}
                          {bed.isAvailable ? "🟢 Available" : "🔴 Occupied"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleBed(bed.id, roomIndex)}
                          disabled={busy}
                          className={`rounded-full px-3 py-1 text-[11px] font-medium text-white transition-colors disabled:opacity-50 ${
                            bed.isAvailable
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {bed.isAvailable ? "Mark occupied" : "Mark available"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                >
                  <span className="text-xs text-gray-700">
                    {bed.type || "Standard"}{" "}
                    {bed.isAvailable ? "🟢 Available" : "🔴 Occupied"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleBed(bed.id)}
                    disabled={busy}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium text-white transition-colors disabled:opacity-50 ${
                      bed.isAvailable
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {bed.isAvailable ? "Mark occupied" : "Mark available"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── DESCRIPTION ─── */}
        {property.title && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {distanceLabel && (
                <DetailRow label="Distance">
                  {distanceLabel}
                </DetailRow>
              )}

              {genderLabel && (
                <DetailRow label="Gender">{genderLabel}</DetailRow>
              )}

              <DetailRow label="Price">
                K{property.price.toLocaleString()} {periodLabel}
              </DetailRow>

              <DetailRow label="Location">{property.location}</DetailRow>

              {uniName && (
                <DetailRow label="University">{uniName}</DetailRow>
              )}

              {property.createdAt && (
                <DetailRow label="Listed">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(property.createdAt).toLocaleDateString()}
                    <span className="text-gray-400">·</span>
                    {timeAgo(property.createdAt)}
                  </span>
                </DetailRow>
              )}

              {property.updatedAt &&
                property.createdAt &&
                property.updatedAt !== property.createdAt && (
                  <DetailRow label="Last updated">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} />
                      {timeAgo(property.updatedAt)}
                    </span>
                  </DetailRow>
                )}
            </div>

            {/* Amenities */}
            {(property.amenities || property.additionalAmenities?.length) && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-2">
                  {property.amenities?.electricity && (
                    <AmenityChip icon={<Bolt size={12} />} label="Electricity" />
                  )}
                  {property.amenities?.water && (
                    <AmenityChip icon={<Droplet size={12} />} label="Water" />
                  )}
                  {property.amenities?.security && (
                    <AmenityChip icon={<ShieldCheck size={12} />} label="Security" />
                  )}
                  {property.additionalAmenities?.map((a) => (
                    <AmenityChip key={a} icon={<Sparkles size={12} />} label={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ACTIONS ─── */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/landlord/edit-listing/${property.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
          >
            <Pencil size={14} />
            Edit
          </Link>

          {!boosted && (
            <button
              type="button"
              onClick={() => setBoostModalOpen(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Star size={14} />
              Boost (K100)
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isActive ? <EyeOff size={14} /> : <EyeIcon size={14} />}
            {isActive ? "Deactivate" : "Activate"}
          </button>

          <Link
            href={publicHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ExternalLink size={14} />
            View public page
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* ─── BOOST MODAL (inline K100 — matches dashboard) ─── */}
      {boostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--nexora-text-primary)]">
                Boost Listing
              </h3>
              <button
                type="button"
                onClick={() => setBoostModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You are about to boost <strong>{property.title}</strong>.
              </p>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">Payment Instructions</p>
                <p className="mt-1">
                  Pay <strong>K100</strong> via Mobile Money to:
                </p>
                <p className="mt-1 font-mono text-base">+260 0771319817</p>
                <p className="mt-1 text-xs text-blue-600">
                  Reference: Boost {property.id.slice(0, 8)}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                After payment, contact support or wait for admin to activate your
                boost. It will be active for 30 days.
              </p>
              <button
                type="button"
                onClick={() => {
                  toast.info("Boost request sent. Admin will review and activate.");
                  setBoostModalOpen(false);
                }}
                className="w-full rounded-full bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
              >
                I Have Paid (Request Activation)
              </button>
              <button
                type="button"
                onClick={() => setBoostModalOpen(false)}
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

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function PerfCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  accent: "blue" | "green" | "amber" | "gray";
}) {
  const styles: Record<typeof accent, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
  };
  const s = styles[accent];

  return (
    <div className="card-premium p-4">
      <div
        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full ${s.bg} ${s.text}`}
      >
        <Icon size={16} />
      </div>
      <p className="text-center text-xl font-bold text-[var(--nexora-text-primary)]">
        {value}
      </p>
      <p className="mt-0.5 text-center text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm text-gray-800">{children}</p>
    </div>
  );
}

function AmenityChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {icon}
      {label}
    </span>
  );
}