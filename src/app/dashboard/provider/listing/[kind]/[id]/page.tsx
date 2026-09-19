"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { BackButton } from "@/components/ui/BackButton";
import { getUniversityFullName } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import { BoostListingModal } from "@/components/provider/BoostListingModal";
import {
  getServicesByOwner,
  deleteService,
  updateService,
} from "@/services/serviceService";
import {
  getProductsByOwner,
  deleteProduct,
  updateProduct,
} from "@/services/productService";
import {
  Service,
  SERVICE_CATEGORIES,
  isServiceBoosted,
  getServiceBoostDaysRemaining,
  isServiceDiscountActive,
  getServiceDiscountedPrice,
  AVAILABILITY_DAY_LABELS,
  AVAILABILITY_MODE_LABELS,
  PAYMENT_METHOD_LABELS,
  BoostDuration,
} from "@/types/service";
import {
  Product,
  PRODUCT_CONDITIONS,
  isProductBoosted,
  getProductBoostDaysRemaining,
  isProductDiscountActive,
  getProductDiscountedPrice,
} from "@/types/product";
import {
  Eye,
  MessageCircle,
  Zap,
  Flame,
  MapPin,
  Globe,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  ExternalLink,
  Store,
  ShoppingBag,
  Wrench,
  ArrowLeft,
} from "lucide-react";

interface PageProps {
  params: Promise<{ kind: string; id: string }>;
}

export default function ListingDetailPage({ params }: PageProps) {
  const { kind, id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const isService = kind === "service";
  const isProduct = kind === "product";

  const [service, setService] = useState<Service | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Ticking clock for live discount countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!isService && !isProduct) {
      setNotFound(true);
      setIsFetching(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        if (isService) {
          const all = await getServicesByOwner(user.uid);
          const found = all.find((s) => s.id === id);
          if (!active) return;
          if (!found) {
            setNotFound(true);
          } else {
            setService(found);
          }
        } else {
          const all = await getProductsByOwner(user.uid);
          const found = all.find((p) => p.id === id);
          if (!active) return;
          if (!found) {
            setNotFound(true);
          } else {
            setProduct(found);
          }
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
  }, [user, id, isService, isProduct]);

  async function handleDelete() {
    const listing = service || product;
    if (!listing) return;
    const label = service ? service.title : product!.name;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setBusy(true);
    try {
      if (isService) {
        await deleteService(id);
      } else {
        await deleteProduct(id);
      }
      toast.success("Listing deleted.");
      router.push("/dashboard/provider");
    } catch {
      toast.error("Failed to delete listing.");
      setBusy(false);
    }
  }

  async function handleToggle() {
    if (!service && !product) return;
    setBusy(true);
    try {
      if (isService && service) {
        const next = service.status === "available" ? "inactive" : "available";
        await updateService(id, { status: next, updatedAt: Date.now() });
        setService({ ...service, status: next });
      } else if (isProduct && product) {
        const next = product.status === "available" ? "sold" : "available";
        await updateProduct(id, { status: next, updatedAt: Date.now() });
        setProduct({ ...product, status: next });
      }
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleBoostConfirm(duration: BoostDuration, amount: number) {
    setBusy(true);
    try {
      const nowTs = Date.now();
      if (isService && service) {
        await updateService(id, {
          boostRequested: true,
          boostRequestedAt: nowTs,
          boostRequestedDuration: duration,
          boostRequestedAmount: amount,
          updatedAt: nowTs,
        });
        setService({
          ...service,
          boostRequested: true,
          boostRequestedAt: nowTs,
          boostRequestedDuration: duration,
          boostRequestedAmount: amount,
        });
        try {
          await fetch("/api/admin/announce", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "⚡ New boost request",
              body: `${service.title} — K${amount.toFixed(2)} ${duration} payment pending`,
              targetRole: undefined,
            }),
          });
        } catch {
          // silent
        }
      } else if (isProduct && product) {
        await updateProduct(id, {
          boostRequested: true,
          boostRequestedAt: nowTs,
          boostRequestedDuration: duration,
          boostRequestedAmount: amount,
          updatedAt: nowTs,
        });
        setProduct({
          ...product,
          boostRequested: true,
          boostRequestedAt: nowTs,
          boostRequestedDuration: duration,
          boostRequestedAmount: amount,
        });
        try {
          await fetch("/api/admin/announce", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "⚡ New boost request",
              body: `${product.name} — K${amount.toFixed(2)} ${duration} payment pending`,
              targetRole: undefined,
            }),
          });
        } catch {
          // silent
        }
      }
      toast.success("Boost request sent! Admin will activate shortly.");
      setShowBoost(false);
    } catch {
      toast.error("Failed to send boost request.");
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
  if (notFound || (!service && !product)) {
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
              href="/dashboard/provider"
              className="mt-4 inline-flex items-center rounded-full bg-[var(--nexora-primary)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Resolve listing data ──
  const title = service ? service.title : product!.name;
  const images = (service ? service.imageUrls : product!.imageUrls) || [];
  const primaryImage = images[0] || null;
  const location = service ? service.location : product!.location;
  const universityId = service ? service.universityId : product!.universityId;
  const description = service ? service.description : product!.description;
  const createdAt = service ? service.createdAt : product!.createdAt;
  const updatedAt = service ? service.updatedAt : product!.updatedAt;
  const views = (service ? service.views : product!.views) || 0;
  const contacts = (service ? service.whatsappClicks : product!.whatsappClicks) || 0;
  const status = service ? service.status : product!.status;
  const isActive = status === "available";

  const boosted = service
    ? isServiceBoosted(service)
    : isProductBoosted(product!);
  const boostDays = service
    ? getServiceBoostDaysRemaining(service)
    : getProductBoostDaysRemaining(product!);

  const boostRequested = service
    ? !!service.boostRequested
    : !!product!.boostRequested;

  const discountActive = service
    ? isServiceDiscountActive(service)
    : isProductDiscountActive(product!);

  const discountPercent = service
    ? service.discountPercent
    : product!.discountPercent;

  const discountExpiresAt = service
    ? service.discountExpiresAt
    : product!.discountExpiresAt;

  const discountedPrice = service
    ? getServiceDiscountedPrice(service)
    : getProductDiscountedPrice(product!);

  // Discount countdown
  let discountRemaining: string | null = null;
  if (discountActive && discountExpiresAt) {
    const ms = discountExpiresAt - now;
    if (ms > 0) {
      const hours = Math.floor(ms / 3600000);
      if (hours < 1) {
        discountRemaining = `${Math.max(1, Math.floor(ms / 60000))}m left`;
      } else if (hours < 24) {
        discountRemaining = `${hours}h left`;
      } else {
        discountRemaining = `${Math.floor(hours / 24)}d left`;
      }
    }
  }

  // Service-specific extras
  const categoryLabel = service
    ? SERVICE_CATEGORIES.find((c) => c.id === service.category)?.label ||
      service.category
    : null;

  const categoryIcon = service
    ? SERVICE_CATEGORIES.find((c) => c.id === service.category)?.icon
    : null;

  const conditionLabel = product
    ? PRODUCT_CONDITIONS.find((c) => c.id === product.condition)?.label ||
      product.condition
    : null;

  // Public URL
  const publicHref = service
    ? `/services/${service.id}`
    : `/marketplace/${product!.id}`;

  const uniName = universityId ? getUniversityFullName(universityId) : null;

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6 pb-24">
      <div className="container-medium">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ─── HERO ─── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                {service ? (
                  <Wrench size={48} strokeWidth={1.5} />
                ) : (
                  <ShoppingBag size={48} strokeWidth={1.5} />
                )}
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
              {categoryLabel && (
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
                  {categoryIcon} {categoryLabel}
                </span>
              )}
              {conditionLabel && (
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
                  {conditionLabel}
                </span>
              )}
            </div>

            <div className="absolute right-3 top-3 flex flex-wrap items-center gap-2">
              {boosted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                  <Zap size={12} fill="currentColor" />
                  Boosted
                </span>
              )}
              {boostRequested && !boosted && (
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                  Boost pending
                </span>
              )}
              {discountActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  <Flame size={12} fill="currentColor" />
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                <span className="rounded-full bg-gray-900/90 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white">
                  {status}
                </span>
              </div>
            )}
          </div>

          {/* Header content */}
          <div className="p-5">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {title}
            </h1>

            {/* Location + university */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                {service?.isOnline ? (
                  <>
                    <Globe size={14} className="text-cyan-600" />
                    <span className="text-cyan-700">Online service</span>
                  </>
                ) : (
                  <>
                    <MapPin size={14} />
                    {location}
                  </>
                )}
              </span>
              {uniName && <span>{uniName}</span>}
            </div>

            {/* Price */}
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              {service ? (
                service.priceType === "contact" ? (
                  <span className="text-lg font-semibold text-gray-500">
                    Contact for price
                  </span>
                ) : discountActive && discountedPrice !== null ? (
                  <>
                    <span className="text-2xl font-bold text-red-600">
                      From K{discountedPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      K{service.priceFrom?.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[var(--nexora-navy)]">
                    From K{service.priceFrom?.toLocaleString()}
                  </span>
                )
              ) : discountActive && discountedPrice !== null ? (
                <>
                  <span className="text-2xl font-bold text-red-600">
                    K{discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    K{product!.price.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-[var(--nexora-navy)]">
                  K{product!.price.toLocaleString()}
                </span>
              )}
            </div>

            {discountRemaining && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                <Flame size={12} fill="currentColor" />
                Deal ends in {discountRemaining}
              </div>
            )}
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
              value={views}
              accent="blue"
            />
            <PerfCard
              icon={MessageCircle}
              label="WhatsApp taps"
              value={contacts}
              accent="green"
            />
            <PerfCard
              icon={Zap}
              label={boosted ? "Boost days left" : "Boost status"}
              value={boosted ? boostDays : 0}
              accent="amber"
              textValue={boosted ? undefined : boostRequested ? "Pending" : "Not boosted"}
            />
            <PerfCard
              icon={Store}
              label="Status"
              value={0}
              accent={isActive ? "green" : "gray"}
              textValue={isActive ? "Active" : status.charAt(0).toUpperCase() + status.slice(1)}
            />
          </div>
        </div>

        {/* ─── DESCRIPTION ─── */}
        {description && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {description}
            </p>
          </div>
        )}

        {/* ─── DETAILS ─── */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Service-specific */}
            {service && (
              <>
                <DetailRow label="Category">
                  {categoryIcon} {categoryLabel}
                </DetailRow>

                {service.availability && (
                  <>
                    {service.availability.days &&
                      service.availability.days.length > 0 && (
                        <DetailRow label="Days">
                          {service.availability.days
                            .map((d) => AVAILABILITY_DAY_LABELS[d])
                            .join(", ")}
                        </DetailRow>
                      )}
                    {service.availability.from && service.availability.to && (
                      <DetailRow label="Hours">
                        {service.availability.from} – {service.availability.to}
                      </DetailRow>
                    )}
                    {service.availability.mode && (
                      <DetailRow label="Mode">
                        {AVAILABILITY_MODE_LABELS[service.availability.mode]}
                      </DetailRow>
                    )}
                  </>
                )}

                {service.paymentMethods &&
                  service.paymentMethods.length > 0 && (
                    <DetailRow label="Payment">
                      {service.paymentMethods
                        .map((m) => PAYMENT_METHOD_LABELS[m])
                        .join(", ")}
                    </DetailRow>
                  )}

                {service.serviceArea && (
                  <DetailRow label="Also serves">
                    {service.serviceArea}
                  </DetailRow>
                )}
              </>
            )}

            {/* Product-specific */}
            {product && (
              <>
                <DetailRow label="Condition">{conditionLabel}</DetailRow>
                <DetailRow label="Category">{product.category}</DetailRow>
              </>
            )}

            <DetailRow label="Location">
              {service?.isOnline ? "Online" : location}
            </DetailRow>

            {uniName && <DetailRow label="University">{uniName}</DetailRow>}

            <DetailRow label="WhatsApp">
              {service ? service.whatsapp : product!.whatsapp}
            </DetailRow>

            {createdAt && (
              <DetailRow label="Listed">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(createdAt).toLocaleDateString()}
                  <span className="text-gray-400">·</span>
                  {timeAgo(createdAt)}
                </span>
              </DetailRow>
            )}

            {updatedAt && createdAt && updatedAt !== createdAt && (
              <DetailRow label="Last updated">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  {timeAgo(updatedAt)}
                </span>
              </DetailRow>
            )}
          </div>
        </div>

        {/* ─── ACTIONS ─── */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/provider/edit-listing/${isService ? "service" : "product"}/${id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
          >
            <Pencil size={14} />
            Edit
          </Link>

          {!boosted && !boostRequested && (
            <button
              type="button"
              onClick={() => setShowBoost(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Zap size={14} />
              Boost
            </button>
          )}

          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isService
              ? isActive
                ? "Mark inactive"
                : "Mark active"
              : isActive
              ? "Mark sold"
              : "Mark available"}
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

      {/* Boost modal */}
      {showBoost && (
        <BoostListingModal
          listingId={id}
          listingTitle={title}
          listingType={isService ? "service" : "product"}
          onClose={() => setShowBoost(false)}
          onConfirm={handleBoostConfirm}
        />
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
  textValue,
  accent,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  textValue?: string;
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
        {textValue ?? value}
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