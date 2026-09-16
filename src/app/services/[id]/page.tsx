"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getServiceById } from "@/services/serviceService";
import {
  Service,
  SERVICE_CATEGORIES,
  AVAILABILITY_DAY_LABELS,
  PAYMENT_METHOD_LABELS,
  AvailabilityDay,
} from "@/types/service";
import { getUniversityFullName } from "@/lib/universityLabels";
import { trackListing } from "@/lib/trackListing";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppContactButton } from "@/components/whatsapp/WhatsAppContactButton";
import {
  ArrowLeft,
  MapPin,
  Eye,
  ShieldCheck,
  Clock,
  DollarSign,
  CreditCard,
  ImagePlus,
  MessageCircle,
} from "lucide-react";

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [service, setService] = useState<Service | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
  const images = service.imageUrls || [];
  const isInactive = service.status !== "available";

  // ─── Availability display ───
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

  // ─── Price display ───
  const priceLabel =
    service.priceType === "from" && service.priceFrom
      ? `From K${service.priceFrom.toLocaleString()}`
      : service.priceType === "contact"
      ? "Contact for price"
      : null;

  const prefillMessage = `Hi, I found your "${service.title}" service listed on Peza. I'm interested — is it available?`;

  const viewMorePhotosHref = buildWhatsAppLink(
    service.whatsapp,
    `Hi, I saw your "${service.title}" on Peza. Can you share more photos?`
  );

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

        {/* ─── Images ─── */}
        {images.length > 0 && (
          <>
            <div className="mb-3 overflow-hidden rounded-2xl">
              <img
                src={images[0]}
                alt={service.title}
                className="h-56 w-full object-cover sm:h-72"
              />
            </div>

            {images.length > 1 && (
              <div className="mb-3 grid grid-cols-2 gap-3">
                {images.slice(1, 3).map((url, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
                  >
                    <img
                      src={url}
                      alt={`${service.title} ${i + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {viewMorePhotosHref && !isInactive && (
              <a
                href={viewMorePhotosHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackListing("service", service.id, "whatsappClicks")}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--nexora-primary)] hover:text-[var(--nexora-primary)]"
              >
                <ImagePlus size={14} />
                View more photos on WhatsApp
              </a>
            )}
          </>
        )}

        {/* ─── Main info ─── */}
        <div className="card-premium p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {cat && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[var(--nexora-primary)]">
                  {cat.icon} {cat.label}
                </span>
              )}
              <h1 className="mt-2 text-xl font-bold text-[var(--nexora-navy)] sm:text-2xl">
                {service.title}
              </h1>

              {priceLabel && (
                <p className="mt-2 text-lg font-bold text-[var(--nexora-primary)]">
                  {priceLabel}
                </p>
              )}

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

          {/* ─── Availability + Payment + Views ─── */}
          {(availDaysLabel || availHoursLabel || availModeLabel || service.paymentMethods?.length) && (
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
              {service.paymentMethods?.map((m) => (
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
            <p className="mt-2 text-xs text-gray-500 italic">
              📌 {avail.note}
            </p>
          )}

          {/* ─── Secondary meta ─── */}
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

          {/* ─── Primary CTA ─── */}
          {!isInactive && (
            <div className="mt-5">
              <WhatsAppContactButton
                whatsapp={service.whatsapp}
                message={prefillMessage}
                onTrack={() => trackListing("service", service.id, "whatsappClicks")}
                size="lg"
                fullWidth
                label="Chat on WhatsApp"
              />
            </div>
          )}
        </div>

        {/* ─── Description ─── */}
        <div className="card-premium mt-4 p-5">
          <h2 className="mb-2 text-sm font-semibold text-[var(--nexora-navy)]">
            About this service
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {service.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <MessageCircle size={12} />
          <span>Contact is handled privately through WhatsApp</span>
        </div>
      </div>

      <Footer />
    </main>
  );
}