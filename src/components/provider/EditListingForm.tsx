"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { updateService } from "@/services/serviceService";
import { updateProduct } from "@/services/productService";
import { universities } from "@/data/universities";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { stripUndefined } from "@/lib/stripUndefined";
import {
  SERVICE_CATEGORIES,
  Service,
  ServiceCategory,
  AvailabilityDay,
  AvailabilityMode,
  PaymentMethod,
  AVAILABILITY_DAY_LABELS,
  PAYMENT_METHOD_LABELS,
  isServiceDiscountActive,
} from "@/types/service";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  Product,
  ProductCondition,
  isProductDiscountActive,
  getProductCategoryLabel,
} from "@/types/product";
import {
  Wrench,
  ShoppingBag,
  ArrowRight,
  Tag,
  MapPin,
  Phone,
  Image as ImageIcon,
  FileText,
  Clock,
  Flame,
  Timer,
  Globe,
  Package,
  Gift,
} from "lucide-react";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

type EditListingFormProps =
  | { type: "service"; initialService: Service }
  | { type: "product"; initialProduct: Product };

type DiscountDuration = "daily" | "weekly" | "monthly";
type PriceType = "free" | "from" | "contact";

const ALL_DAYS: AvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DISCOUNT_DURATIONS: { id: DiscountDuration; label: string; ms: number }[] = [
  { id: "daily", label: "Daily", ms: 1 * 86400000 },
  { id: "weekly", label: "Weekly", ms: 7 * 86400000 },
  { id: "monthly", label: "Monthly", ms: 30 * 86400000 },
];

function guessDuration(msRemaining: number): DiscountDuration {
  const days = msRemaining / 86400000;
  if (days <= 1.5) return "daily";
  if (days <= 15) return "weekly";
  return "monthly";
}

export function EditListingForm(props: EditListingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userLocation = useGeolocation();
  const isService = props.type === "service";

  const initialService = isService ? props.initialService : null;
  const initialProduct = !isService ? props.initialProduct : null;

  // ─── Common ───
  const [title, setTitle] = useState(
    isService ? initialService!.title : initialProduct!.name
  );
  const [description, setDescription] = useState(
    isService ? initialService!.description : initialProduct!.description
  );
  const [location, setLocation] = useState(
    isService ? initialService!.location : initialProduct!.location
  );
  const [universityId, setUniversityId] = useState(
    isService ? initialService!.universityId : initialProduct!.universityId
  );
  const [whatsapp, setWhatsapp] = useState(
    isService ? initialService!.whatsapp : initialProduct!.whatsapp
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    (isService ? initialService!.imageUrls : initialProduct!.imageUrls) || []
  );

  // 🌐 Online service
  const [isOnline, setIsOnline] = useState(
    isService ? !!initialService!.isOnline : false
  );

  // 📍 Map coordinates
  const [latitude, setLatitude] = useState<number | undefined>(
    isService ? initialService!.latitude : initialProduct!.latitude
  );
  const [longitude, setLongitude] = useState<number | undefined>(
    isService ? initialService!.longitude : initialProduct!.longitude
  );

  // ─── Service-specific ───
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(
    isService ? initialService!.category : "barber"
  );
  const [priceType, setPriceType] = useState<PriceType>(
    isService
      ? (initialService!.priceType as PriceType) || "from"
      : "from"
  );
  const [priceFrom, setPriceFrom] = useState(
    isService && initialService!.priceFrom ? String(initialService!.priceFrom) : ""
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    isService ? initialService!.paymentMethods || ["cash"] : ["cash"]
  );
  const [serviceArea, setServiceArea] = useState(
    isService ? initialService!.serviceArea || "" : ""
  );

  // ─── Availability ───
  const [availDays, setAvailDays] = useState<AvailabilityDay[]>(
    isService && initialService!.availability?.days?.length
      ? initialService!.availability.days
      : ALL_DAYS
  );
  const [availFrom, setAvailFrom] = useState(
    isService && initialService!.availability?.from ? initialService!.availability.from : "08:00"
  );
  const [availTo, setAvailTo] = useState(
    isService && initialService!.availability?.to ? initialService!.availability.to : "18:00"
  );
  const [availMode, setAvailMode] = useState<AvailabilityMode>(
    isService && initialService!.availability?.mode ? initialService!.availability.mode : "walk_in"
  );
  const [availNote, setAvailNote] = useState(
    isService && initialService!.availability?.note ? initialService!.availability.note : ""
  );

  // ─── Product-specific ───
  const [price, setPrice] = useState(!isService ? String(initialProduct!.price) : "");
  const [productCategory, setProductCategory] = useState(
    !isService ? initialProduct!.category : ""
  );
  const [condition, setCondition] = useState<ProductCondition>(
    !isService ? initialProduct!.condition : "used"
  );
  const [quantity, setQuantity] = useState(
    !isService && initialProduct!.quantity !== undefined && initialProduct!.quantity !== null
      ? String(initialProduct!.quantity)
      : ""
  );

  // ─── Flash deal ───
  const initialHasDiscount = isService
    ? isServiceDiscountActive(initialService!) ||
      (!!initialService!.discountPercent && !!initialService!.discountExpiresAt)
    : isProductDiscountActive(initialProduct!) ||
      (!!initialProduct!.discountPercent && !!initialProduct!.discountExpiresAt);

  const initialPercent = isService ? initialService!.discountPercent : initialProduct!.discountPercent;
  const initialExpiresAt = isService ? initialService!.discountExpiresAt : initialProduct!.discountExpiresAt;

  const [hasDiscount, setHasDiscount] = useState(initialHasDiscount);
  const [discountPercent, setDiscountPercent] = useState(initialPercent ? String(initialPercent) : "20");
  const [discountDuration, setDiscountDuration] = useState<DiscountDuration>(
    initialExpiresAt ? guessDuration(initialExpiresAt - Date.now()) : "daily"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLegacyCategory =
    !isService &&
    !!productCategory &&
    !PRODUCT_CATEGORIES.some((c) => c.id === productCategory);

  // 🎁 Track mount so the auto-cleanup effect only runs on user-initiated changes
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!isService) return;

    if (priceType === "free") {
      setPaymentMethods([]);
      setHasDiscount(false);
    } else if (priceType === "from" && paymentMethods.length === 0) {
      setPaymentMethods(["cash"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceType]);

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

  const isFreeService = isService && priceType === "free";
  const showDiscountSection =
    !isFreeService &&
    (!isService || (isService && priceType === "from"));

  const showMapPicker = !(isService && isOnline);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Please fill in title and description.");
      return;
    }
    if (!isOnline && !location.trim()) {
      setError("Please enter a location, or mark this as an online service.");
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
    if (isService && priceType === "from") {
      if (!priceFrom || Number(priceFrom) <= 0) {
        setError("Please enter a starting price, or choose another pricing option.");
        return;
      }
    }
    if (!isService) {
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
          setError("Stock quantity must be a whole number (0 or more), or leave it empty.");
          return;
        }
      }
    }

    let discountPayload: { discountPercent?: number; discountExpiresAt?: number } = {};

    if (hasDiscount && showDiscountSection) {
      const percent = Math.round(Number(discountPercent));
      if (!percent || percent < 5 || percent > 90) {
        setError("Discount must be between 5% and 90%.");
        return;
      }
      const duration = DISCOUNT_DURATIONS.find((d) => d.id === discountDuration);
      if (!duration) return;

      const stillValid =
        initialExpiresAt &&
        initialExpiresAt > Date.now() &&
        initialPercent === percent &&
        guessDuration(initialExpiresAt - Date.now()) === discountDuration;

      discountPayload = {
        discountPercent: percent,
        discountExpiresAt: stillValid ? initialExpiresAt : Date.now() + duration.ms,
      };
    } else {
      discountPayload = { discountPercent: 0, discountExpiresAt: 0 };
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
        ...discountPayload,
      };

      if (showMapPicker && latitude !== undefined && longitude !== undefined) {
        commonBase.latitude = latitude;
        commonBase.longitude = longitude;
      } else {
        commonBase.latitude = null;
        commonBase.longitude = null;
      }

      if (isService && initialService) {
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
          priceFrom:
            priceType === "from"
              ? Number(priceFrom)
              : priceType === "free"
              ? 0
              : undefined,
          paymentMethods: priceType === "free" ? [] : paymentMethods,
          serviceArea: !isOnline && serviceArea.trim() ? serviceArea.trim() : undefined,
        };

        await updateService(
          initialService.id,
          stripUndefined(servicePayload) as any
        );
      } else if (!isService && initialProduct) {
        const productData: Record<string, any> = {
          ...commonBase,
          name: title.trim(),
          price: Number(price),
          category: productCategory.trim(),
          condition,
        };

        if (quantity.trim() !== "") {
          productData.quantity = Number(quantity);
        } else {
          productData.quantity = null;
        }

        productData.sellerName = user.fullName || null;
        productData.sellerBusinessName = user.businessName || null;
        productData.sellerPhotoURL = user.photoURL || null;

        await updateProduct(
          initialProduct.id,
          stripUndefined(productData) as any
        );
      }

      toast.success(
        isService ? "Service updated successfully! 🎉" : "Product updated successfully! 🎉"
      );
      router.push("/dashboard/provider");
    } catch (err) {
      console.error("Edit listing error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const defaultCenter: [number, number] | undefined =
    userLocation.latitude && userLocation.longitude
      ? [userLocation.latitude, userLocation.longitude]
      : latitude !== undefined && longitude !== undefined
      ? [latitude, longitude]
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${
            isService
              ? "bg-gradient-to-br from-cyan-500 to-teal-600"
              : "bg-gradient-to-br from-orange-500 to-pink-600"
          }`}
        >
          {isService ? <Wrench size={18} /> : <ShoppingBag size={18} />}
        </span>
        <div>
          <p className="text-xs text-gray-500">Editing</p>
          <p className="text-sm font-semibold text-gray-900">
            {isService ? "Service" : "Product"} listing
          </p>
        </div>
      </div>

      <Section icon={<FileText size={16} />} title="Basic information">
        <Field label={isService ? "Service name" : "Product name"}>
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

      <Section icon={<Tag size={16} />} title="Category & pricing">
        {isService ? (
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

              {priceType === "free" && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <Gift size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-900">
                    <strong>This service will show as 🎁 FREE</strong> — no payment
                    required. Payment methods and flash deals are hidden when free.
                  </p>
                </div>
              )}

              {priceType === "from" && (
                <div className="mt-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      K
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="50"
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
                  {(["cash", "mobile_money", "bank_transfer"] as PaymentMethod[]).map((m) => (
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
                  ))}
                </div>
              </Field>
            )}
          </>
        ) : (
          <>
            <Field label="Price (K)">
              <input
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="Product category">
              {isLegacyCategory && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                  <span className="mt-0.5 text-xs">⚠️</span>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Currently saved as{" "}
                    <strong>&ldquo;{getProductCategoryLabel(productCategory)}&rdquo;</strong>{" "}
                    (legacy). Pick a category below to update it.
                  </p>
                </div>
              )}

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
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 10"
                  min={0}
                  disabled={isSubmitting}
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                Leave empty if you only have one. Students see this on the card
                — low stock (≤3) shows urgency.
              </p>
            </Field>
          </>
        )}
      </Section>

      {showDiscountSection && (
        <section className="space-y-4 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/40 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-red-100 pb-3">
            <span className="text-red-500">
              <Flame size={16} fill="currentColor" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Flash Deal <span className="text-xs font-normal text-gray-500">(optional)</span>
            </h2>
            <label className="ml-auto flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={(e) => setHasDiscount(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-medium text-gray-700">
                {initialHasDiscount ? "Active" : "Add discount"}
              </span>
            </label>
          </div>

          {hasDiscount && (
            <div className="space-y-4">
              <Field label="Discount percentage">
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    min={5}
                    max={90}
                    placeholder="20"
                    disabled={isSubmitting}
                    className={`${inputClass} pr-12`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                    % OFF
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[10, 20, 30, 50].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDiscountPercent(String(p))}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        discountPercent === String(p)
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Duration">
                <div className="grid grid-cols-3 gap-2">
                  {DISCOUNT_DURATIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiscountDuration(d.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                        discountDuration === d.id
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                      }`}
                    >
                      <Timer size={12} />
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {initialHasDiscount && !hasDiscount && (
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 p-3">
              <Flame size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Saving will <strong>remove the discount</strong> from this listing.
              </p>
            </div>
          )}
        </section>
      )}

      {isService && (
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
              placeholder="e.g., Closed on public holidays"
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>
        </Section>
      )}

      <Section icon={<MapPin size={16} />} title="Location">
        {isService && (
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
              <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                Offer your service remotely. No physical address or map pin needed.
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
                  {!u.isAvailable ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              ▾
            </span>
          </div>
        </Field>

        {isService && !isOnline && (
          <Field label="Also serves (optional)">
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g., Nkana East, CBD, Buchi"
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
            {latitude !== undefined && longitude !== undefined ? (
              <p className="mt-2 text-xs text-green-600">
                ✓ Location pinned: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-400">
                Tap the map to pin your exact location, or use &quot;My Location&quot;.
                Buyers will see this pin on the Peza Map.
              </p>
            )}
          </Field>
        )}

        {isOnline && (
          <div className="flex items-start gap-2 rounded-lg bg-cyan-50 border border-cyan-200 p-3">
            <Globe size={14} className="mt-0.5 shrink-0 text-cyan-600" />
            <p className="text-xs text-cyan-900 leading-relaxed">
              Your listing will show a <strong>🌐 Online</strong> badge and won&apos;t
              appear on the map.
            </p>
          </div>
        )}
      </Section>

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

/* ──────────────────────────────────────────────── */
/* Sub-components                                  */
/* ──────────────────────────────────────────────── */

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