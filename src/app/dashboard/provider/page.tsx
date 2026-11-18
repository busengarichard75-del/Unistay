// src/app/dashboard/provider/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { auth } from "@/lib/firebase";
import { BackButton } from "@/components/ui/BackButton";
import { getUniversityFullName } from "@/lib/universityLabels";
import { getServicesByOwner, deleteService, updateService } from "@/services/serviceService";
import { getProductsByOwner, deleteProduct, updateProduct } from "@/services/productService";
import { Service, isServiceBoosted, isServiceDiscountActive, BoostDuration } from "@/types/service";
import { Product, isProductBoosted, isProductDiscountActive } from "@/types/product";
import { VerificationBanner } from "@/components/provider/VerificationBanner";
import { BoostListingModal } from "@/components/provider/BoostListingModal";
import { ShareMyShopCard } from "@/components/provider/ShareMyShopCard";
import { UpgradeBanner } from "@/components/provider/UpgradeBanner";
import { PlanUpgradeModal } from "@/components/provider/PlanUpgradeModal";
import { ServiceUpgradeModal } from "@/components/provider/ServiceUpgradeModal";
import { getPlanLimit, getEffectivePlan, PLANS } from "@/lib/plans";
import { getServicePlanLimit, getEffectiveServicePlan, SERVICE_PLANS } from "@/lib/servicePlans";
import { toast } from "sonner";
import {
  Eye, MessageCircle, Package, Plus, Store, Wrench, ShoppingBag,
  Trash2, Check, Flame, Pencil, Zap, ChevronRight, AlertCircle,
  Home, Rocket, Crown, Clock, Sparkles, CalendarDays
} from "lucide-react";

function formatDiscountRemaining(expiresAt: number, now: number): string {
  const ms = expiresAt - now;
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60000))}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export default function ProviderDashboardPage() {
  const { user, isLoading } = useRequireAuth("service_provider");

  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [boostTarget, setBoostTarget] = useState<{ kind: "service" | "product"; id: string; title: string } | null>(null);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showServiceUpgradeModal, setShowServiceUpgradeModal] = useState(false);

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
        const [s, p] = await Promise.all([getServicesByOwner(user.uid), getProductsByOwner(user.uid)]);
        if (!active) return;
        setServices(s); setProducts(p);
      } catch {} finally { if (active) setIsFetching(false); }
    };
    load();
    return () => { active = false; };
  }, [user]);

  const allItems = [
    ...services.map((s) => ({ kind: "service" as const, data: s })),
    ...products.map((p) => ({ kind: "product" as const, data: p })),
  ];

  const totalViews = allItems.reduce((acc, x) => acc + (x.data.views || 0), 0);
  const totalContacts = allItems.reduce((acc, x) => acc + (x.data.whatsappClicks || 0), 0);
  const activeCount = allItems.filter((x) => x.data.status === "available").length;
  const boostedCount = allItems.filter((x) => x.kind === "service" ? isServiceBoosted(x.data as Service) : isProductBoosted(x.data as Product)).length;

  const mostViewed = [...allItems]
    .filter((x) => (x.data.views || 0) > 0)
    .sort((a, b) => (b.data.views || 0) - (a.data.views || 0))[0];

  // ── Product/Property Plan Logic ──
  const effectivePlan = getEffectivePlan(user?.plan, user?.planExpiry);
  const planLimit = getPlanLimit(user?.plan, user?.planExpiry);
  const planName = PLANS[effectivePlan].name;
  const limitLabel = planLimit === Infinity ? "∞" : planLimit;
  const isAtProductLimit = products.length >= planLimit;
  
  const isExpiredPlan = !!user?.plan && user.plan !== "basic" && !!user.planExpiry && user.planExpiry < now;
  const planDaysRemaining = user?.planExpiry && user.plan !== "basic" && !isExpiredPlan ? Math.ceil((user.planExpiry - now) / 86400000) : null;
  const usagePct = planLimit === Infinity ? Math.min(100, products.length * 2) : Math.min(100, Math.round((products.length / planLimit) * 100));

  // ── Service Plan Logic ──
  const effectiveServicePlan = getEffectiveServicePlan(user?.servicePlan, user?.servicePlanExpiry);
  const serviceLimit = getServicePlanLimit(user?.servicePlan, user?.servicePlanExpiry);
  const servicePlanName = SERVICE_PLANS[effectiveServicePlan].name;
  const serviceLimitLabel = serviceLimit === Infinity ? "∞" : serviceLimit;
  const isAtServiceLimit = services.length >= serviceLimit;

  const isExpiredServicePlan = !!user?.servicePlan && user.servicePlan !== "free" && !!user.servicePlanExpiry && user.servicePlanExpiry < now;
  const servicePlanDaysRemaining = user?.servicePlanExpiry && user.servicePlan !== "free" && !isExpiredServicePlan ? Math.ceil((user.servicePlanExpiry - now) / 86400000) : null;
  const serviceUsagePct = serviceLimit === Infinity ? Math.min(100, services.length * 2) : Math.min(100, Math.round((services.length / serviceLimit) * 100));

  // ─── Per-plan visual theme ───
  const planTheme = {
    basic: { cardGradient: "bg-[var(--nexora-navy)]", ring: "", badge: "bg-white/10 text-white border border-white/20", Icon: Home, accent: "text-white", bar: "bg-gray-400", ctaUpgrade: "bg-gradient-to-r from-indigo-500 to-purple-600" },
    pro: { cardGradient: "bg-gradient-to-br from-[var(--nexora-navy)] via-indigo-900 to-indigo-800", ring: "ring-2 ring-indigo-400/40 shadow-lg shadow-indigo-500/20", badge: "bg-indigo-500 text-white border border-indigo-300/40 shadow-md shadow-indigo-500/30", Icon: Rocket, accent: "text-indigo-300", bar: "bg-indigo-400", ctaUpgrade: "bg-gradient-to-r from-amber-500 to-yellow-500" },
    full_time: { cardGradient: "bg-gradient-to-br from-[var(--nexora-navy)] via-amber-950/70 to-amber-900", ring: "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/25", badge: "bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-bold border border-amber-300 shadow-md shadow-amber-500/40", Icon: Crown, accent: "text-amber-300", bar: "bg-gradient-to-r from-amber-400 to-yellow-400", ctaUpgrade: "" },
  } as const;

  const theme = planTheme[effectivePlan];
  const PlanIcon = theme.Icon;

  async function handleDelete(kind: "service" | "product", id: string, label: string) {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      if (kind === "service") { await deleteService(id); setServices((prev) => prev.filter((s) => s.id !== id)); }
      else { await deleteProduct(id); setProducts((prev) => prev.filter((p) => p.id !== id)); }
      toast.success("Listing deleted.");
    } catch { toast.error("Failed to delete listing."); } finally { setBusyId(null); }
  }

  async function handleToggleStatus(kind: "service" | "product", id: string) {
    setBusyId(id);
    try {
      if (kind === "service") {
        const s = services.find((x) => x.id === id); if (!s) return;
        const next = s.status === "available" ? "inactive" : "available";
        await updateService(id, { status: next, updatedAt: Date.now() });
        setServices((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
      } else {
        const p = products.find((x) => x.id === id); if (!p) return;
        const next = p.status === "available" ? "sold" : "available";
        await updateProduct(id, { status: next, updatedAt: Date.now() });
        setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
      }
      toast.success("Status updated.");
    } catch { toast.error("Failed to update status."); } finally { setBusyId(null); }
  }

  async function handleBoostConfirm(duration: BoostDuration, amount: number) {
    if (!boostTarget) return;
    try {
      const nowTs = Date.now();
      if (boostTarget.kind === "service") {
        await updateService(boostTarget.id, { boostRequested: true, boostRequestedAt: nowTs, boostRequestedDuration: duration, boostRequestedAmount: amount, updatedAt: nowTs });
        setServices((prev) => prev.map((s) => s.id === boostTarget.id ? { ...s, boostRequested: true, boostRequestedAt: nowTs, boostRequestedDuration: duration, boostRequestedAmount: amount } : s));
      } else {
        await updateProduct(boostTarget.id, { boostRequested: true, boostRequestedAt: nowTs, boostRequestedDuration: duration, boostRequestedAmount: amount, updatedAt: nowTs });
        setProducts((prev) => prev.map((p) => p.id === boostTarget.id ? { ...p, boostRequested: true, boostRequestedAt: nowTs, boostRequestedDuration: duration, boostRequestedAmount: amount } : p));
      }
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) await fetch("/api/boost-request", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: "⚡ New boost request", body: `${boostTarget.title} — K${amount.toFixed(2)} ${duration} payment pending` }) });
      } catch {}
      toast.success("Boost request sent! Admin will activate shortly.");
      setBoostTarget(null);
    } catch { toast.error("Failed to send boost request."); }
  }

  if (isLoading || !user) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]"><p className="text-sm text-gray-500">Loading...</p></main>;
  }

  const displayName = user.businessName || user.fullName || user.email;
  const uniName = user.university ? getUniversityFullName(user.university) : "Your area";
  const providerLabel = user.providerType === "product" ? "Product Seller" : "Service Provider";
  const hasAnyListing = services.length + products.length > 0;
  const isVerified = (user.verificationStatus || "approved") === "approved";

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4"><BackButton /></div>

        {/* ─────── PREMIUM WELCOME CARD ─────── */}
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white transition-all duration-500 ${theme.cardGradient} ${theme.ring}`}>
          {effectivePlan !== "basic" && (
            <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${effectivePlan === "pro" ? "bg-indigo-400/30" : "bg-amber-400/30"}`} />
          )}
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-gray-400">Welcome back</p>
              <h1 className="mt-1 text-2xl font-extrabold truncate">{displayName}</h1>
              <p className="mt-1 text-xs text-gray-300">{providerLabel} · {uniName}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${theme.badge}`}>
                <PlanIcon size={14} /><span>{planName}</span>
              </div>
              {isExpiredPlan ? (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-200 border border-red-400/30"><Clock size={10} /> Expired</span>
              ) : planDaysRemaining !== null ? (
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90 border border-white/20"><Clock size={10} /> {planDaysRemaining === 1 ? "1 day left" : `${planDaysRemaining} days left`}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ─────── ⭐ APPOINTMENTS BUTTON ─────── */}
        <div className="mt-4">
          <Link href="/dashboard/provider/appointments" className="flex w-full items-center justify-between rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-left transition-all hover:scale-[1.01] hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm"><CalendarDays size={20} /></div>
              <div>
                <p className="text-sm font-bold text-indigo-900">Appointments</p>
                <p className="text-xs text-indigo-600">Manage your service bookings</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-indigo-400" />
          </Link>
        </div>

        {/* ─────── SERVICE PLAN CARD ─────── */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600"><Sparkles size={18} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Service Shop Plan</p>
                <p className="text-sm font-bold text-gray-900">{servicePlanName}</p>
              </div>
            </div>
            {effectiveServicePlan !== "pro" && <button onClick={() => setShowServiceUpgradeModal(true)} className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:scale-105">Upgrade →</button>}
            {effectiveServicePlan === "pro" && <span className="rounded-full bg-amber-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">⭐ Best Plan</span>}
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">{services.length}</span> / <span className="font-bold text-gray-900">{serviceLimitLabel}</span> services used</p>
            <p className="text-xs font-semibold text-gray-500">{serviceLimit === Infinity ? "Unlimited" : `${serviceUsagePct}%`}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${serviceLimit === Infinity ? Math.min(50, serviceUsagePct) : serviceUsagePct}%` }} /></div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
            {effectiveServicePlan === "free" && <><span className="flex items-center gap-1"><Check size={11} className="text-emerald-500" /> 1 service</span><span className="flex items-center gap-1"><Check size={11} className="text-emerald-500" /> Standard support</span></>}
            {effectiveServicePlan === "standard" && <><span className="flex items-center gap-1"><Check size={11} className="text-purple-600" /> 3 services</span><span className="flex items-center gap-1"><Check size={11} className="text-purple-600" /> Priority support</span></>}
            {effectiveServicePlan === "pro" && <><span className="flex items-center gap-1"><Check size={11} className="text-amber-600" /> Unlimited services</span><span className="flex items-center gap-1"><Check size={11} className="text-amber-600" /> Top placement</span></>}
          </div>
        </div>

        {/* ─────── PRODUCT PLAN CARD ─────── */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600"><ShoppingBag size={18} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Product/Property Plan</p>
                <p className="text-sm font-bold text-gray-900">{planName}</p>
              </div>
            </div>
            {effectivePlan !== "full_time" && <button onClick={() => setShowUpgradeModal(true)} className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:scale-105">Upgrade →</button>}
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">{products.length}</span> / <span className="font-bold text-gray-900">{limitLabel}</span> listings used</p>
            <p className="text-xs font-semibold text-gray-500">{planLimit === Infinity ? "Unlimited" : `${usagePct}%`}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200"><div className={`h-full rounded-full transition-all ${theme.bar}`} style={{ width: `${planLimit === Infinity ? Math.min(50, usagePct) : usagePct}%` }} /></div>
        </div>

        <div className="mt-4"><VerificationBanner user={user} /></div>

        {hasAnyListing && <div className="mt-6"><ShareMyShopCard uid={user.uid} displayName={displayName} /></div>}

        <div className="mt-6"><UpgradeBanner plan={user.plan} planExpiry={user.planExpiry} used={products.length} limit={planLimit} onClick={() => setShowUpgradeModal(true)} /></div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Eye} label="Views" value={totalViews} />
          <StatCard icon={MessageCircle} label="WhatsApp" value={totalContacts} />
          <StatCard icon={Package} label="Active" value={activeCount} />
          <StatCard icon={Zap} label="Boosted" value={boostedCount} />
        </div>

        {mostViewed && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Flame size={18} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Most viewed</p>
              <p className="truncate text-sm font-medium text-amber-900">{mostViewed.kind === "service" ? (mostViewed.data as Service).title : (mostViewed.data as Product).name}<span className="ml-2 text-xs text-amber-700/80">· {mostViewed.data.views} views</span></p>
            </div>
          </div>
        )}

        {/* ⭐ ADD LISTING BUTTON (WITH DISABLED STATE) */}
        {isVerified ? (
          <div className="mt-6">
            {isAtProductLimit || isAtServiceLimit ? (
              <button disabled className="flex w-full items-center gap-4 rounded-2xl bg-gray-200 border border-gray-300 p-5 text-left text-gray-500 shadow-inner cursor-not-allowed">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-500"><AlertCircle size={24} /></div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-700">Listing Limit Reached</p>
                  <p className="text-sm text-gray-500">
                    {isAtProductLimit && isAtServiceLimit ? "You have reached both your Product and Service limits." : isAtServiceLimit ? "You have reached your Service limit." : "You have reached your Product limit."} Use the Upgrade buttons above to add more.
                  </p>
                </div>
              </button>
            ) : (
              <Link href="/dashboard/provider/add-listing" className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${effectivePlan === "full_time" ? "bg-gradient-to-r from-amber-500 to-yellow-500" : effectivePlan === "pro" ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20"><Plus size={24} /></div>
                <div className="flex-1">
                  <p className="text-lg font-bold">{hasAnyListing ? "Add Another Listing" : "Add Your First Listing"}</p>
                  <p className="text-sm text-white/80">Create a Service or Product listing</p>
                </div>
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-center"><p className="text-sm font-medium text-gray-700">Add Listing is locked until your account is verified</p></div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--nexora-text-primary)]">Your Listings <span className="text-sm font-normal text-gray-400">({services.length + products.length})</span></h2>
          {isFetching ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />)}</div>
          ) : !hasAnyListing ? (
            <div className="card-premium p-10 text-center"><Store size={28} className="mx-auto mb-4 text-gray-300" /><p className="text-sm font-medium text-gray-500">No listings yet</p></div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => <ListingRow key={s.id} kind="service" id={s.id} title={s.title} subtitle={`${s.category} · ${s.location}`} views={s.views || 0} contacts={s.whatsappClicks || 0} status={s.status} isBoosted={isServiceBoosted(s)} boostRequested={!!s.boostRequested} discountActive={isServiceDiscountActive(s)} discountPercent={s.discountPercent} discountExpiresAt={s.discountExpiresAt} now={now} busy={busyId === s.id} onToggle={() => handleToggleStatus("service", s.id)} onDelete={() => handleDelete("service", s.id, s.title)} onBoost={() => setBoostTarget({ kind: "service", id: s.id, title: s.title })} />)}
              {products.map((p) => <ListingRow key={p.id} kind="product" id={p.id} title={p.name} subtitle={`K${p.price.toLocaleString()} · ${p.location}`} views={p.views || 0} contacts={p.whatsappClicks || 0} status={p.status} isBoosted={isProductBoosted(p)} boostRequested={!!p.boostRequested} discountActive={isProductDiscountActive(p)} discountPercent={p.discountPercent} discountExpiresAt={p.discountExpiresAt} now={now} busy={busyId === p.id} onToggle={() => handleToggleStatus("product", p.id)} onDelete={() => handleDelete("product", p.id, p.name)} onBoost={() => setBoostTarget({ kind: "product", id: p.id, title: p.name })} />)}
            </div>
          )}
        </div>
      </div>

      {boostTarget && <BoostListingModal listingId={boostTarget.id} listingTitle={boostTarget.title} listingType={boostTarget.kind} onClose={() => setBoostTarget(null)} onConfirm={handleBoostConfirm} />}
      <PlanUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentPlan={user.plan} currentPlanExpiry={user.planExpiry} userEmail={user.email} userName={displayName} />
      <ServiceUpgradeModal isOpen={showServiceUpgradeModal} onClose={() => setShowServiceUpgradeModal(false)} currentPlan={user.servicePlan} currentPlanExpiry={user.servicePlanExpiry} userEmail={user.email} userName={displayName} />
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="card-premium p-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]"><Icon size={16} /></div>
      <p className="text-xl font-bold text-[var(--nexora-text-primary)]">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function ListingRow({
  kind, id, title, subtitle, views, contacts, status, isBoosted, boostRequested,
  discountActive, discountPercent, discountExpiresAt, now, busy, onToggle, onDelete, onBoost,
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
  const toggleLabel = kind === "service" ? (isActive ? "Mark inactive" : "Mark active") : (isActive ? "Mark sold" : "Mark available");
  const editHref = `/dashboard/provider/edit-listing/${kind}/${id}`;
  const detailHref = `/dashboard/provider/listing/${kind}/${id}`;
  const discountRemaining = discountActive && discountExpiresAt ? formatDiscountRemaining(discountExpiresAt, now) : null;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${isBoosted ? "border-amber-200" : "border-gray-100"}`}>
      <Link href={detailHref} className="group block cursor-pointer p-4 transition-colors hover:bg-gray-50/50" aria-label={`View ${title} details`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isBoosted ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-[var(--nexora-primary)]"}`}><KindIcon size={16} /></div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
              <span className="truncate">{title}</span>
              {isBoosted && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm" title="Boosted"><Zap size={11} fill="currentColor" /></span>}
              {boostRequested && !isBoosted && <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">BOOST PENDING</span>}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
            {discountRemaining && <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 border border-red-100"><Flame size={11} fill="currentColor" /><span>{discountPercent}% OFF · {discountRemaining}</span></div>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1"><Eye size={11} />{views}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={11} />{contacts}</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{status}</span>
            </div>
          </div>
          <ChevronRight size={18} className="mt-1 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" aria-hidden="true" />
        </div>
      </Link>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-3">
        {!isBoosted && !boostRequested && <button type="button" onClick={onBoost} disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"><Zap size={12} />Boost</button>}
        <Link href={editHref} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"><Pencil size={12} />Edit</Link>
        <button type="button" onClick={onToggle} disabled={busy} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">{toggleLabel}</button>
        <button type="button" onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"><Trash2 size={12} />Delete</button>
      </div>
    </div>
  );
}