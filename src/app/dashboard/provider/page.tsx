"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { BackButton } from "@/components/ui/BackButton";
import { getUniversityFullName } from "@/lib/universityLabels";
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
  isServiceBoosted,
  isServiceDiscountActive,
  BoostDuration,
} from "@/types/service";
import {
  Product,
  isProductBoosted,
  isProductDiscountActive,
} from "@/types/product";
import { VerificationBanner } from "@/components/provider/VerificationBanner";
import { BoostListingModal } from "@/components/provider/BoostListingModal";
import { ShareMyShopCard } from "@/components/provider/ShareMyShopCard";
import { toast } from "sonner";
import {
  Eye,
  MessageCircle,
  Package,
  Plus,
  Store,
  Wrench,
  ShoppingBag,
  Trash2,
  Check,
  Flame,
  Pencil,
  Zap,
  ChevronRight,
} from "lucide-react";

function formatDiscountRemaining(expiresAt: number, now: number): string {
  const ms = expiresAt - now;
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(ms / 60000));
    return `${minutes}m left`;
  }
  if (hours < 24) {
    return `${hours}h left`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export default function ProviderDashboardPage() {
  const { user, isLoading } = useRequireAuth("service_provider");

  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [boostTarget, setBoostTarget] = useState<
    { kind: "service" | "product"; id: string; title: string } | null
  >(null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          getServicesByOwner(user.uid),
          getProductsByOwner(user.uid),
        ]);
        if (!active) return;
        setServices(s);
        setProducts(p);
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const allItems = [
    ...services.map((s) => ({ kind: "service" as const, data: s })),
    ...products.map((p) => ({ kind: "product" as const, data: p })),
  ];

  const totalViews = allItems.reduce((acc, x) => acc + (x.data.views || 0), 0);
  const totalContacts = allItems.reduce(
    (acc, x) => acc + (x.data.whatsappClicks || 0),
    0
  );
  const activeCount = allItems.filter((x) => x.data.status === "available").length;
  const boostedCount = allItems.filter((x) =>
    x.kind === "service"
      ? isServiceBoosted(x.data as Service)
      : isProductBoosted(x.data as Product)
  ).length;

  const mostViewed = [...allItems]
    .filter((x) => (x.data.views || 0) > 0)
    .sort((a, b) => (b.data.views || 0) - (a.data.views || 0))[0];

  async function handleDelete(kind: "service" | "product", id: string, label: string) {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      if (kind === "service") {
        await deleteService(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
      } else {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
      toast.success("Listing deleted.");
    } catch {
      toast.error("Failed to delete listing.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(kind: "service" | "product", id: string) {
    setBusyId(id);
    try {
      if (kind === "service") {
        const s = services.find((x) => x.id === id);
        if (!s) return;
        const next = s.status === "available" ? "inactive" : "available";
        await updateService(id, { status: next, updatedAt: Date.now() });
        setServices((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: next } : x))
        );
      } else {
        const p = products.find((x) => x.id === id);
        if (!p) return;
        const next = p.status === "available" ? "sold" : "available";
        await updateProduct(id, { status: next, updatedAt: Date.now() });
        setProducts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: next } : x))
        );
      }
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleBoostConfirm(duration: BoostDuration, amount: number) {
    if (!boostTarget) return;
    try {
      const nowTs = Date.now();
      if (boostTarget.kind === "service") {
        await updateService(boostTarget.id, {
          boostRequested: true,
          boostRequestedAt: nowTs,
          boostRequestedDuration: duration,
          boostRequestedAmount: amount,
          updatedAt: nowTs,
        });
        setServices((prev) =>
          prev.map((s) =>
            s.id === boostTarget.id
              ? {
                  ...s,
                  boostRequested: true,
                  boostRequestedAt: nowTs,
                  boostRequestedDuration: duration,
                  boostRequestedAmount: amount,
                }
              : s
          )
        );
      } else {
        await updateProduct(boostTarget.id, {
          boostRequested: true,
          boostRequestedAt: nowTs,
          boostRequestedDuration: duration,
          boostRequestedAmount: amount,
          updatedAt: nowTs,
        });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === boostTarget.id
              ? {
                  ...p,
                  boostRequested: true,
                  boostRequestedAt: nowTs,
                  boostRequestedDuration: duration,
                  boostRequestedAmount: amount,
                }
              : p
          )
        );
      }

      try {
        await fetch("/api/admin/announce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "⚡ New boost request",
            body: `${boostTarget.title} — K${amount.toFixed(2)} ${duration} payment pending`,
            targetRole: undefined,
          }),
        });
      } catch {
        // silent
      }

      toast.success("Boost request sent! Admin will activate shortly.");
      setBoostTarget(null);
    } catch {
      toast.error("Failed to send boost request.");
    }
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const displayName = user.businessName || user.fullName || user.email;
  const uniName = user.university ? getUniversityFullName(user.university) : "Your area";
  const isProduct = user.providerType === "product";
  const providerLabel = isProduct ? "Product Seller" : "Service Provider";
  const hasAnyListing = services.length + products.length > 0;

  const verificationStatus = user.verificationStatus || "approved";
  const isVerified = verificationStatus === "approved";

  const shopHintParts: string[] = [];
  if (services.length > 0) {
    shopHintParts.push(`${services.length} service${services.length === 1 ? "" : "s"}`);
  }
  if (products.length > 0) {
    shopHintParts.push(`${products.length} product${products.length === 1 ? "" : "s"}`);
  }
  const shopHint = shopHintParts.join(" · ");

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="card-premium bg-[var(--nexora-navy)] p-6 text-white">
          <p className="text-sm text-gray-300">Welcome back</p>
          <h1 className="mt-1 text-xl font-bold">{displayName}</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            {providerLabel} · {uniName}
          </p>
        </div>

        <div className="mt-6">
          <VerificationBanner user={user} />
        </div>

        {/* 📣 SHARE MY SHOP */}
        {hasAnyListing && (
          <div className="mt-6">
            <ShareMyShopCard
              uid={user.uid}
              displayName={displayName}
              hint={shopHint || undefined}
            />
          </div>
        )}

        {/* Insights */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Eye} label="Views" value={totalViews} />
          <StatCard icon={MessageCircle} label="WhatsApp" value={totalContacts} />
          <StatCard icon={Package} label="Active" value={activeCount} />
          <StatCard icon={Zap} label="Boosted" value={boostedCount} />
        </div>

        {mostViewed && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Flame size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Most viewed
              </p>
              <p className="truncate text-sm font-medium text-amber-900">
                {mostViewed.kind === "service"
                  ? (mostViewed.data as Service).title
                  : (mostViewed.data as Product).name}
                <span className="ml-2 text-xs text-amber-700/80">
                  · {mostViewed.data.views} views
                </span>
              </p>
            </div>
          </div>
        )}

        {isVerified ? (
          <div className="mt-6">
            <Link
              href="/dashboard/provider/add-listing"
              className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-left text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Plus size={24} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold">
                  {hasAnyListing ? "Add Another Listing" : "Add Your First Listing"}
                </p>
                <p className="text-sm text-white/80">
                  Create a Service or Product listing
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-sm font-medium text-gray-700">
              {verificationStatus === "pending"
                ? "You can add listings once your account is approved"
                : "Add Listing is locked until your account is verified"}
            </p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
            Your Listings
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({services.length + products.length})
            </span>
          </h2>

          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : !hasAnyListing ? (
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                <Store size={28} />
              </div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                No listings yet
              </p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                {!isVerified
                  ? "Once verified, you can create your first listing."
                  : isProduct
                  ? "Create your first product listing to start selling to students."
                  : "Create your first service listing to start receiving students."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <ListingRow
                  key={s.id}
                  kind="service"
                  id={s.id}
                  title={s.title}
                  subtitle={`${s.category} · ${s.location}`}
                  views={s.views || 0}
                  contacts={s.whatsappClicks || 0}
                  status={s.status}
                  isBoosted={isServiceBoosted(s)}
                  boostRequested={!!s.boostRequested}
                  discountActive={isServiceDiscountActive(s)}
                  discountPercent={s.discountPercent}
                  discountExpiresAt={s.discountExpiresAt}
                  now={now}
                  busy={busyId === s.id}
                  onToggle={() => handleToggleStatus("service", s.id)}
                  onDelete={() => handleDelete("service", s.id, s.title)}
                  onBoost={() => setBoostTarget({ kind: "service", id: s.id, title: s.title })}
                />
              ))}
              {products.map((p) => (
                <ListingRow
                  key={p.id}
                  kind="product"
                  id={p.id}
                  title={p.name}
                  subtitle={`K${p.price.toLocaleString()} · ${p.location}`}
                  views={p.views || 0}
                  contacts={p.whatsappClicks || 0}
                  status={p.status}
                  isBoosted={isProductBoosted(p)}
                  boostRequested={!!p.boostRequested}
                  discountActive={isProductDiscountActive(p)}
                  discountPercent={p.discountPercent}
                  discountExpiresAt={p.discountExpiresAt}
                  now={now}
                  busy={busyId === p.id}
                  onToggle={() => handleToggleStatus("product", p.id)}
                  onDelete={() => handleDelete("product", p.id, p.name)}
                  onBoost={() => setBoostTarget({ kind: "product", id: p.id, title: p.name })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {boostTarget && (
        <BoostListingModal
          listingId={boostTarget.id}
          listingTitle={boostTarget.title}
          listingType={boostTarget.kind}
          onClose={() => setBoostTarget(null)}
          onConfirm={handleBoostConfirm}
        />
      )}
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <div className="card-premium p-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
        <Icon size={16} />
      </div>
      <p className="text-xl font-bold text-[var(--nexora-text-primary)]">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function ListingRow({
  kind,
  id,
  title,
  subtitle,
  views,
  contacts,
  status,
  isBoosted,
  boostRequested,
  discountActive,
  discountPercent,
  discountExpiresAt,
  now,
  busy,
  onToggle,
  onDelete,
  onBoost,
}: {
  kind: "service" | "product";
  id: string;
  title: string;
  subtitle: string;
  views: number;
  contacts: number;
  status: string;
  isBoosted: boolean;
  boostRequested: boolean;
  discountActive: boolean;
  discountPercent?: number;
  discountExpiresAt?: number;
  now: number;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onBoost: () => void;
}) {
  const isActive = status === "available";
  const KindIcon = kind === "service" ? Wrench : ShoppingBag;
  const toggleLabel =
    kind === "service"
      ? isActive
        ? "Mark inactive"
        : "Mark active"
      : isActive
      ? "Mark sold"
      : "Mark available";

  const editHref = `/dashboard/provider/edit-listing/${kind}/${id}`;
  const detailHref = `/dashboard/provider/listing/${kind}/${id}`;

  const discountRemaining =
    discountActive && discountExpiresAt
      ? formatDiscountRemaining(discountExpiresAt, now)
      : null;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${isBoosted ? "border-amber-200" : "border-gray-100"}`}>
      <Link
        href={detailHref}
        className="group block cursor-pointer p-4 transition-colors hover:bg-gray-50/50"
        aria-label={`View ${title} details`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isBoosted ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-[var(--nexora-primary)]"
            }`}
          >
            <KindIcon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
              <span className="truncate">{title}</span>

              {isBoosted && (
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm"
                  title="Boosted"
                >
                  <Zap size={11} fill="currentColor" />
                </span>
              )}

              {boostRequested && !isBoosted && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  BOOST PENDING
                </span>
              )}
            </p>

            <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>

            {discountRemaining && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 border border-red-100">
                <Flame size={11} fill="currentColor" />
                <span>
                  {discountPercent}% OFF · {discountRemaining}
                </span>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Eye size={11} />
                {views}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={11} />
                {contacts}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${
                  isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <ChevronRight
            size={18}
            className="mt-1 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
            aria-hidden="true"
          />
        </div>
      </Link>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-3">
        {!isBoosted && !boostRequested && (
          <button
            type="button"
            onClick={onBoost}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Zap size={12} />
            Boost
          </button>
        )}
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Pencil size={12} />
          Edit
        </Link>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {toggleLabel}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}