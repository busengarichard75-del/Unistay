"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { updateService } from "@/services/serviceService";
import { updateProduct } from "@/services/productService";
import { universities } from "@/data/universities";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { stripUndefined } from "@/lib/stripUndefined";
import {
  Service,
  SERVICE_CATEGORIES,
  ServiceCategory,
  AvailabilityDay,
  AvailabilityMode,
  PaymentMethod,
  AVAILABILITY_DAY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/service";
import {
  Product,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCondition,
} from "@/types/product";
import {
  Wrench,
  ShoppingBag,
  Check,
  ArrowRight,
  Tag,
  MapPin,
  Phone,
  Image as ImageIcon,
  FileText,
  Clock,
  Globe,
  Package,
  Gift,
  Handshake,
} from "lucide-react";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

type ListingType = "service" | "product";
type PriceType = "free" | "from" | "contact";

const ALL_DAYS: AvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

interface EditListingFormProps {
  type: ListingType;
  initialService?: Service;
  initialProduct?: Product;
}

export function EditListingForm({ type, initialService, initialProduct }: EditListingFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const listing = type === "service" ? initialService : initialProduct;

  // ── Common State ──
  const [title, setTitle] = useState(
    type === "service" 
      ? (initialService?.title || "") 
      : (initialProduct?.name || "")
  );
  const [description, setDescription] = useState(listing?.description || "");
  const [location, setLocation] = useState(listing?.location || "");
  const [universityId, setUniversityId] = useState(listing?.universityId || "");
  const [whatsapp, setWhatsapp] = useState(listing?.whatsapp || "");
  const [imageUrls, setImageUrls] = useState<string[]>(listing?.imageUrls || []);
  const [latitude, setLatitude] = useState<number | undefined>(listing?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(listing?.longitude);

  // ── Service State ──
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(
    initialService?.category || "barber"
  );
  const [priceType, setPriceType] = useState<PriceType>(
    initialService?.priceType || "from"
  );
  const [priceFrom, setPriceFrom] = useState(
    initialService?.priceFrom?.toString() || ""
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    initialService?.paymentMethods || ["cash"]
  );
  const [serviceArea, setServiceArea] = useState(initialService?.serviceArea || "");
  const [isOnline, setIsOnline] = useState(initialService?.isOnline || false);

  const [availDays, setAvailDays] = useState<AvailabilityDay[]>(
    initialService?.availability?.days || ALL_DAYS
  );
  const [availFrom, setAvailFrom] = useState(
    initialService?.availability?.from || "08:00"
  );
  const [availTo, setAvailTo] = useState(
    initialService?.availability?.to || "18:00"
  );
  const [availMode, setAvailMode] = useState<AvailabilityMode>(
    initialService?.availability?.mode || "walk_in"
  );
  const [availNote, setAvailNote] = useState(
    initialService?.availability?.note || ""
  );

  // ── Product State ──
  const [price, setPrice] = useState(initialProduct?.price?.toString() || "");
  const [productCategory, setProductCategory] = useState(
    initialProduct?.category || ""
  );
  const [condition, setCondition] = useState<ProductCondition>(
    initialProduct?.condition || "used"
  );
  const [quantity, setQuantity] = useState(
    initialProduct?.quantity?.toString() || ""
  );
  const [isNegotiable, setIsNegotiable] = useState(
    initialProduct?.isNegotiable || false
  );
  const [lastPrice, setLastPrice] = useState(
    initialProduct?.lastPrice?.toString() || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (type === "service" && priceType === "free") {
      setPaymentMethods([]);
    } else if (type === "service" && priceType === "from" && paymentMethods.length === 0) {
      setPaymentMethods(["cash"]);
    }
  }, [type, priceType, paymentMethods.length]);

  if (!listing) return null;

  function toggleDay(day: AvailabilityDay) {
    setAvailDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function togglePayment(method: PaymentMethod) {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  }

  const isFreeService = type === "service" && priceType === "free";
  const showMapPicker = !(type === "service" && isOnline);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!listing) return;

    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Please fill in title and description.");
      return;
    }
    if (!isOnline && !location.trim()) {
      setError("Please enter a location.");
      return;
    }
    if (showMapPicker && (latitude === undefined || longitude === undefined)) {
      setError("Please pin your location on the map.");
      return;
    }
    if (!universityId) {
      setError("Please select a university.");
      return;
    }
    if (!whatsapp.trim()) {
      setError("Please provide your WhatsApp number.");
      return;
    }
    if (type === "service" && priceType === "from" && (!priceFrom || Number(priceFrom) <= 0)) {
      setError("Please enter a starting price.");
      return;
    }
    if (type === "product") {
      if (!price || Number(price) <= 0) {
        setError("Please enter a valid price.");
        return;
      }
      if (!productCategory.trim()) {
        setError("Please pick a product category.");
        return;
      }
      if (quantity.trim() !== "") {
        const q = Number(quantity);
        if (isNaN(q) || q < 0 || !Number.isInteger(q)) {
          setError("Stock quantity must be a whole number.");
          return;
        }
      }
      if (isNegotiable) {
        if (!lastPrice || Number(lastPrice) <= 0) {
          setError("Please enter a valid last price, or turn off negotiation.");
          return;
        }
        if (Number(lastPrice) >= Number(price)) {
          setError("Last price must be strictly less than the original price.");
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const commonBase: Record<string, any> = {
        description: description.trim(),
        imageUrls,
        location: isOnline ? "Online service" : location.trim(),
        universityId,
        whatsapp: whatsapp.trim(),
        updatedAt: now,
      };

      if (showMapPicker && latitude !== undefined && longitude !== undefined) {
        commonBase.latitude = latitude;
        commonBase.longitude = longitude;
      }

      if (type === "service") {
        const servicePayload: Record<string, any> = {
          ...commonBase,
          title: title.trim(),
          category: serviceCategory,
          isOnline,
          availability: {
            days: availDays,
            from: availFrom,
            to: availTo,
            mode: availMode,
            note: availNote.trim() || undefined,
          },
          priceType,
          priceFrom: priceType === "from" ? Number(priceFrom) : priceType === "free" ? 0 : undefined,
          paymentMethods: priceType === "free" ? [] : paymentMethods,
          serviceArea: !isOnline && serviceArea.trim() ? serviceArea.trim() : undefined,
        };

        await updateService(listing.id, stripUndefined(servicePayload) as any);
      } else {
        const productPayload: Record<string, any> = {
          ...commonBase,
          name: title.trim(),
          price: Number(price),
          category: productCategory.trim(),
          condition,
        };

        if (quantity.trim() !== "") productPayload.quantity = Number(quantity);
        else productPayload.quantity = null;
        
        productPayload.isNegotiable = isNegotiable;
        if (isNegotiable && lastPrice) {
          productPayload.lastPrice = Number(lastPrice);
        } else {
          productPayload.lastPrice = null;
        }

        await updateProduct(listing.id, stripUndefined(productPayload) as any);
      }

      toast.success("Listing updated successfully!");
      router.push("/dashboard/provider");
    } catch (err) {
      console.error("Edit listing error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const defaultCenter: [number, number] | undefined =
    latitude && longitude ? [latitude, longitude] : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Basic info ─── */}
      <Section icon={<FileText size={16} />} title="Basic information">
        <Field label={type === "service" ? "Service name" : "Product name"}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Category & pricing ─── */}
      <Section icon={<Tag size={16} />} title="Category & pricing">
        {type === "service" ? (
          <>
            <Field label="Service category">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SERVICE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setServiceCategory(c.id)}
                    className={`rounded-xl border-2 p-3 text-left text-xs font-medium transition-all ${
                      serviceCategory === c.id
                        ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                        : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                    }`}
                  >
                    <div className="text-base">{c.icon}</div>
                    <div className="mt-1">{c.label}</div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Pricing">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriceType("free")}
                  className={`rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                    priceType === "free"
                      ? "border-emerald-500 bg-emerald-50/60 text-emerald-800"
                      : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                  }`}
                >
                  🎁 Free
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType("from")}
                  className={`rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                    priceType === "from"
                      ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                      : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                  }`}
                >
                  💰 Starting from
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType("contact")}
                  className={`rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                    priceType === "contact"
                      ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                      : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                  }`}
                >
                  💬 Contact
                </button>
              </div>

              {priceType === "from" && (
                <div className="mt-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      K
                    </span>
                    <input
                      type="number"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      disabled={isSubmitting}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              )}
            </Field>

            {priceType !== "free" && (
              <Field label="Payment methods accepted">
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "mobile_money", "bank_transfer"] as PaymentMethod[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => togglePayment(m)}
                        className={`rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                          paymentMethods.includes(m)
                            ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                            : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[m]}
                      </button>
                    )
                  )}
                </div>
              </Field>
            )}
          </>
        ) : (
          <>
            <Field label="Price (K)">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="Product category">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRODUCT_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setProductCategory(c.id)}
                    className={`rounded-xl border-2 p-3 text-left text-xs font-medium transition-all ${
                      productCategory === c.id
                        ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                        : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                    }`}
                  >
                    <div className="text-base">{c.icon}</div>
                    <div className="mt-1">{c.label}</div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Condition">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRODUCT_CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCondition(c.id)}
                    className={`rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                      condition === c.id
                        ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                        : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="How many do you have? (optional)">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Package size={16} />
                </span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={0}
                  disabled={isSubmitting}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

            {/* ─── Negotiation ─── */}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--nexora-primary)] focus:ring-[var(--nexora-primary)]"
                />
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <Handshake size={16} className="text-blue-600" />
                    Allow Negotiation
                  </p>
                  <p className="text-[11px] text-blue-700/80">
                    Buyers can click "Negotiate" to reveal a hidden last price.
                  </p>
                </div>
              </label>

              {isNegotiable && (
                <div className="mt-4 pl-7">
                  <Field label="Last Price (K)">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        K
                      </span>
                      <input
                        type="number"
                        value={lastPrice}
                        onChange={(e) => setLastPrice(e.target.value)}
                        disabled={isSubmitting}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </Field>
                </div>
              )}
            </div>
          </>
        )}
      </Section>

      {/* ─── Availability (service only) ─── */}
      {type === "service" && (
        <Section icon={<Clock size={16} />} title="Availability">
          <Field label="Which days?">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAvailDays(availDays.length === 7 ? [] : ALL_DAYS)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                  availDays.length === 7
                    ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                    : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                }`}
              >
                Every day
              </button>
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                    availDays.includes(d)
                      ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                      : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                  }`}
                >
                  {AVAILABILITY_DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <input
                type="time"
                value={availFrom}
                onChange={(e) => setAvailFrom(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>
            <Field label="To">
              <input
                type="time"
                value={availTo}
                onChange={(e) => setAvailTo(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="How do students reach you?">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["walk_in", "appointment", "both"] as AvailabilityMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAvailMode(m)}
                  className={`rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                    availMode === m
                      ? "border-[var(--nexora-primary)] bg-blue-50/50 text-[var(--nexora-navy)]"
                      : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                  }`}
                >
                  {m === "walk_in"
                    ? "🚶 Walk-in"
                    : m === "appointment"
                    ? "📅 By appointment"
                    : "🤝 Both"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notes (optional)">
            <input
              type="text"
              value={availNote}
              onChange={(e) => setAvailNote(e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        </Section>
      )}

      {/* ─── Location ─── */}
      <Section icon={<MapPin size={16} />} title="Location">
        {type === "service" && (
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
              isOnline
                ? "border-cyan-500 bg-cyan-50/60"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={isOnline}
              onChange={(e) => {
                setIsOnline(e.target.checked);
                if (e.target.checked) {
                  setLatitude(undefined);
                  setLongitude(undefined);
                }
              }}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <Globe
                  size={14}
                  className={isOnline ? "text-cyan-600" : "text-gray-400"}
                />
                Online service
              </p>
            </div>
          </label>
        )}

        {!isOnline && (
          <Field label="Area / address">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        )}

        <Field label="University / primary area">
          <div className="relative">
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              disabled={isSubmitting}
              className={`${inputClass} appearance-none pr-10`}
            >
              <option value="">Select a university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                  {u.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              ▾
            </span>
          </div>
        </Field>

        {type === "service" && !isOnline && (
          <Field label="Also serves (optional)">
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        )}

        {showMapPicker && (
          <Field label="Pin your location on the map">
            <PropertyMap
              selectable
              onLocationSelect={(lat, lng) => {
                if (lat === 0 && lng === 0) {
                  setLatitude(undefined);
                  setLongitude(undefined);
                } else {
                  setLatitude(lat);
                  setLongitude(lng);
                }
              }}
              latitude={latitude}
              longitude={longitude}
              height="260px"
              defaultCenter={defaultCenter}
              showMyLocation={true}
              showSearch={true}
              showFallback={true}
            />
          </Field>
        )}
      </Section>

      {/* ─── Contact ─── */}
      <Section icon={<Phone size={16} />} title="Contact">
        <Field label="WhatsApp number">
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Images ─── */}
      <Section icon={<ImageIcon size={16} />} title="Photos">
        <MultiImageUploader
          onUpload={(urls) => setImageUrls(urls)}
          initialImages={imageUrls}
          maxImages={2}
        />
      </Section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[var(--nexora-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50 sm:w-auto"
        >
          <span className="inline-flex items-center gap-2">
            {isSubmitting ? "Saving..." : "Save Changes"}
            {!isSubmitting && <ArrowRight size={14} />}
          </span>
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50";

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <span className="text-[var(--nexora-primary)]">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}