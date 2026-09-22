"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getServiceById, getServicesByCategory } from "@/services/serviceService";
import {
  Service,
  SERVICE_CATEGORIES,
  AVAILABILITY_DAY_LABELS,
  PAYMENT_METHOD_LABELS,
  AvailabilityDay,
  isServiceFree,
} from "@/types/service";
import { getUniversityFullName, getUniversityShortLabel } from "@/lib/universityLabels";
import { trackListing } from "@/lib/trackListing";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { optimizeCardImage } from "@/lib/imageUrl";
import { useAuth } from "@/lib/AuthContext";
import { WhatsAppContactButton } from "@/components/whatsapp/WhatsAppContactButton";
import { ReportButton } from "@/components/shared/ReportButton";
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { RelatedListings } from "@/components/shared/RelatedListings";
import { LoginRequiredModal } from "@/components/shared/LoginRequiredModal";
import { ServiceCard } from "@/components/services/ServiceCard";
import {
  ArrowLeft,
  MapPin,
  Eye,
  ShieldCheck,
  Clock,
  CreditCard,
  ImagePlus,
  MessageCircle,
  Globe,
  Store,
  ChevronRight,
  Gift,
  Sparkles,
} from "lucide-react";

// ── Client-only components (skip SSR to avoid server crash) ──
const ReviewSection = dynamic(
  () => import("@/components/reviews/ReviewSection").then((m) => m.ReviewSection),
  { ssr: false }
);
const FollowButton = dynamic(
  () => import("@/components/follow/FollowButton").then((m) => m.FollowButton),
  { ssr: false }
);

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id;

  const [service, setService] = useState<Service | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [related, setRelated] = useState<Service[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await getServiceById(id);
        if (!data) setNotFound(true);
        else setService(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id || tracked.current || !service || service.adminHidden) return;
    tracked.current = true;
    trackListing("service", id, "views");
  }, [id, service]);

  useEffect(() => {
    if (!service) return;
    let active = true;
    const loadRelated = async () => {
      try {
        const items = await getServicesByCategory(
          service.category,
          service.id,
          service.universityId,
          8
        );
        if (active) setRelated(items);
      } catch {
        // silent
      }
    };
    loadRelated();
    return () => {
      active = false;
    };
  }, [service]);

  if (isFetching) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-10">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-40 w-full rounded-xl bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !service) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-16 text-center">
          <p className="text-sm text-gray-500">Service not found.</p>
          <button
            onClick={() => router.push("/services")}
            className="mt-4 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            ← Back to Services
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const rawImages = service.imageUrls || [];
  const images = rawImages.map((u) => optimizeCardImage(u));
  const isInactive = service.status !== "available";
  const isFree = isServiceFree(service);

  const avail = service.availability;
  const availDaysLabel = avail?.days?.length
    ? avail.days.length === 7
      ? "Every day"
      : avail.days.map((d) => AVAILABILITY_DAY_LABELS[d as AvailabilityDay]).join(", ")
    : null;
  const availHoursLabel =
    avail?.from && avail?.to ? `${avail.from}–${avail.to}` : null;
  const availModeLabel =
    avail?.mode === "walk_in"
      ? "Walk-in"
      : avail?.mode === "appointment"
      ? "By appointment"
      : avail?.mode === "both"
      ? "Walk-in & appointment"
      : null;

  const priceLabel =
    service.priceType === "from" && service.priceFrom
      ? `From K${service.priceFrom.toLocaleString()}`
      : service.priceType === "contact"
      ? "Contact for price"
      : null;

  const prefillMessage = isFree
    ? `Hi, I found your "${service.title}" service listed as FREE on Peza. I'm interested — is it still available?`
    : `Hi, I found your "${service.title}" service listed on Peza. I'm interested — is it available?`;

  const viewMorePhotosHref = buildWhatsAppLink(
    service.whatsapp,
    `Hi, I saw your "${service.title}" on Peza. Can you share more photos?`
  );

  const showPaymentMethods = !isFree && (service.paymentMethods?.length ?? 0) > 0;

  const handleViewMorePhotos = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
      return;
    }
    trackListing("service", service.id, "whatsappClicks", user.uid);
  };

  const relatedTitle = cat?.label ? `More ${cat.label}` : "More services";
  const relatedSubtitle = service.universityId
    ? `near ${getUniversityShortLabel(service.universityId)}`
    : undefined;
  const relatedSeeAllHref = `/services?cat=${service.category}`;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          className={
            related.length > 0
              ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
              : "grid grid-cols-1 gap-6"
          }
        >
          <div className="min-w-0">
            {images.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="mb-3 block w-full overflow-hidden rounded-2xl"
                >
                  <img
                    src={images[0]}
                    alt={service.title}
                    loading="eager"
                    decoding="async"
                    className="h-56 w-full object-cover transition-transform duration-300 hover:scale-[1.02] sm:h-72"
                  />
                </button>

                {images.length > 1 && (
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    {images.slice(1, 3).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i + 1)}
                        className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
                      >
                        <img
                          src={url}
                          alt={`${service.title} ${i + 2}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {viewMorePhotosHref && !isInactive && (
                  <a
                    href={viewMorePhotosHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleViewMorePhotos}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--nexora-primary)] hover:text-[var(--nexora-primary)]"
                  >
                    <ImagePlus size={14} />
                    View more photos on WhatsApp
                  </a>
                )}
              </>
            )}

            <div className="card-premium p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {cat && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[var(--nexora-primary)]">
                      {cat.icon} {cat.label}
                    </span>
                  )}
                  {service.isOnline && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700">
                      <Globe size={11} /> Online
                    </span>
                  )}
                  {isFree && !isInactive && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                      <Gift size={11} /> FREE
                    </span>
                  )}
                  <h1 className="mt-2 text-xl font-bold text-[var(--nexora-navy)] sm:text-2xl">
                    {service.title}
                  </h1>

                  {isFree ? (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-600">
                        🎁 FREE
                      </span>
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        No payment required
                      </span>
                    </div>
                  ) : priceLabel ? (
                    <p className="mt-2 text-lg font-bold text-[var(--nexora-primary)]">
                      {priceLabel}
                    </p>
                  ) : null}

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={14} className="shrink-0" />
                    {service.location}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {getUniversityFullName(service.universityId)}
                  </p>
                  {service.serviceArea && (
                    <p className="mt-1 text-xs text-gray-400">
                      Also serves: {service.serviceArea}
                    </p>
                  )}
                </div>

                {isInactive && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Currently unavailable
                  </span>
                )}
              </div>

              {(availDaysLabel || availHoursLabel || availModeLabel || showPaymentMethods) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                  {(availDaysLabel || availHoursLabel) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-700">
                      <Clock size={12} />
                      {[availDaysLabel, availHoursLabel].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {availModeLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-700">
                      {availModeLabel}
                    </span>
                  )}
                  {showPaymentMethods &&
                    service.paymentMethods?.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
                      >
                        <CreditCard size={12} />
                        {PAYMENT_METHOD_LABELS[m]}
                      </span>
                    ))}
                </div>
              )}

              {avail?.note && (
                <p className="mt-2 text-xs text-gray-500 italic">📌 {avail.note}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                  <Eye size={12} />
                  {service.views || 0} views
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs text-green-700">
                  <ShieldCheck size={12} />
                  Verified Provider
                </span>
              </div>

              {/* ─── Sold by + Follow ─── */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition-colors hover:border-[var(--nexora-primary)]/40 hover:bg-blue-50/40">
                <Link
                  href={`/provider/${service.ownerId}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-navy)] text-white">
                    <Store size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Sold by</p>
                    <p className="truncate text-sm font-semibold text-[var(--nexora-navy)] group-hover:underline">
                      View provider profile
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-gray-400" />
                </Link>
                <FollowButton variant="light" providerId={service.ownerId} />
              </div>

              {!isInactive && (
                <div className="mt-4">
                  <WhatsAppContactButton
                    whatsapp={service.whatsapp}
                    message={prefillMessage}
                    onTrack={() =>
                      trackListing(
                        "service",
                        service.id,
                        "whatsappClicks",
                        user?.uid
                      )
                    }
                    size="lg"
                    fullWidth
                    label={isFree ? "Claim this free service" : "Chat on WhatsApp"}
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-4">
              <ShareButton targetType="service" targetTitle={service.title} />
              <span className="text-gray-300">·</span>
              <ReportButton
                targetType="service"
                targetId={service.id}
                targetTitle={service.title}
                targetOwnerId={service.ownerId}
              />
            </div>

            <div className="card-premium mt-4 p-5">
              <h2 className="mb-2 text-sm font-semibold text-[var(--nexora-navy)]">
                About this service
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {service.description}
              </p>
            </div>

            {/* ─── Reviews (client-only) ─── */}
            <ReviewSection
              targetType="service"
              targetId={service.id}
              targetOwnerId={service.ownerId}
              targetTitle={service.title}
            />

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <MessageCircle size={12} />
              <span>Contact is handled privately through WhatsApp</span>
            </div>
          </div>

          {related.length > 0 && (
            <RelatedListings
              title={relatedTitle}
              subtitle={relatedSubtitle}
              count={related.length}
              seeAllHref={relatedSeeAllHref}
              seeAllLabel="See all"
              icon={<Sparkles size={16} />}
            >
              {related.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </RelatedListings>
          )}
        </div>
      </div>

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        alt={service.title}
      />

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to contact"
        subtitle="Create a free Peza account to message this provider — it keeps everyone on Peza safe and accountable."
      />

      <Footer />
    </main>
  );
}