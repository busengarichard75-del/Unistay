"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { addService } from "@/services/serviceService";
import { addProduct } from "@/services/productService";
import { universities } from "@/data/universities";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import {
  SERVICE_CATEGORIES,
  ServiceCategory,
  AvailabilityDay,
  AvailabilityMode,
  PaymentMethod,
  AVAILABILITY_DAY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/service";
import {
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
} from "lucide-react";

type ListingType = "service" | "product";

const ALL_DAYS: AvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function AddListingForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState<ListingType>("service");

  // Common
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [universityId, setUniversityId] = useState(user?.university || "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || "");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Service-specific
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("barber");
  const [priceType, setPriceType] = useState<"from" | "contact">("from");
  const [priceFrom, setPriceFrom] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(["cash"]);
  const [serviceArea, setServiceArea] = useState("");

  // Availability (service only)
  const [availDays, setAvailDays] = useState<AvailabilityDay[]>(ALL_DAYS);
  const [availFrom, setAvailFrom] = useState("08:00");
  const [availTo, setAvailTo] = useState("18:00");
  const [availMode, setAvailMode] = useState<AvailabilityMode>("walk_in");
  const [availNote, setAvailNote] = useState("");

  // Product-specific
  const [price, setPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("used");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync whatsapp/university if user loads after mount
  useEffect(() => {
    if (user?.whatsapp && !whatsapp) setWhatsapp(user.whatsapp);
    if (user?.university && !universityId) setUniversityId(user.university);
  }, [user, whatsapp, universityId]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError("");

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please fill in title, description, and location.");
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
    if (type === "service" && priceType === "from") {
      if (!priceFrom || Number(priceFrom) <= 0) {
        setError("Please enter a starting price, or choose 'Contact for price'.");
        return;
      }
    }
    if (type === "product") {
      if (!price || Number(price) <= 0) {
        setError("Please enter a valid price.");
        return;
      }
      if (!productCategory.trim()) {
        setError("Please enter a product category.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const commonBase = {
        ownerId: user.uid,
        description: description.trim(),
        imageUrls,
        location: location.trim(),
        universityId,
        whatsapp: whatsapp.trim(),
        views: 0,
        whatsappClicks: 0,
        createdAt: now,
        updatedAt: now,
        adminHidden: false,
        adminHiddenReason: null,
      };

      if (type === "service") {
        await addService({
          ...commonBase,
          title: title.trim(),
          category: serviceCategory,
          status: "available",
          availability: {
            days: availDays,
            from: availFrom,
            to: availTo,
            mode: availMode,
            note: availNote.trim() || undefined,
          },
          priceType,
          priceFrom: priceType === "from" ? Number(priceFrom) : undefined,
          paymentMethods,
          serviceArea: serviceArea.trim() || undefined,
        });
      } else {
        await addProduct({
          ...commonBase,
          name: title.trim(),
          price: Number(price),
          category: productCategory.trim(),
          condition,
          status: "available",
        });
      }

      toast.success(
        type === "service"
          ? "Service listing created! 🎉"
          : "Product listing created! 🎉"
      );
      router.push("/dashboard/provider");
    } catch (err) {
      console.error("Add listing error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Type toggle ─── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Listing type
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TypeCard
            active={type === "service"}
            onClick={() => setType("service")}
            icon={<Wrench size={20} />}
            title="Service"
            subtitle="Barber, printing, repairs…"
          />
          <TypeCard
            active={type === "product"}
            onClick={() => setType("product")}
            icon={<ShoppingBag size={20} />}
            title="Product"
            subtitle="Phones, books, food…"
          />
        </div>
      </div>

      {/* ─── Basic info ─── */}
      <Section icon={<FileText size={16} />} title="Basic information">
        <Field label={type === "service" ? "Service name" : "Product name"}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "service" ? "e.g., Fresh Fade Barber" : "e.g., Redmi Note 13"
            }
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "service"
                ? "What do you offer? What's included? Any special skills?"
                : "Condition details, what's included, any flaws?"
            }
            rows={4}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Category & type-specific ─── */}
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
              <div className="grid grid-cols-2 gap-2">
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
                  💬 Contact for price
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
          </>
        ) : (
          <>
            <Field label="Price (K)">
              <input
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 2500"
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="Product category">
              <input
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                placeholder="e.g., Phones, Books, Furniture"
                disabled={isSubmitting}
                className={inputClass}
              />
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
                onClick={() =>
                  setAvailDays(availDays.length === 7 ? [] : ALL_DAYS)
                }
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

      {/* ─── Location ─── */}
      <Section icon={<MapPin size={16} />} title="Location">
        <Field label="Area / address">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Riverside, Kitwe"
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

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

        {type === "service" && (
          <Field label="Also serves (optional)">
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g., Nkana East, CBD, Buchi"
              disabled={isSubmitting}
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Other areas you serve beyond your main location
            </p>
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
            placeholder="e.g., 097 123 4567"
            disabled={isSubmitting}
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Students will contact you via WhatsApp. Your number is never shown publicly.
          </p>
        </Field>
      </Section>

      {/* ─── Images ─── */}
      <Section icon={<ImageIcon size={16} />} title="Photos">
        <MultiImageUploader
          onUpload={(urls) => setImageUrls(urls)}
          initialImages={imageUrls}
          maxImages={2}
        />
        <p className="text-[11px] text-gray-400">
          📸 Up to 2 photos. Students can request more via WhatsApp.
        </p>
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
            {isSubmitting ? "Creating..." : "Create Listing"}
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

function TypeCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
        active
          ? "border-[var(--nexora-primary)] bg-blue-50/50 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      {active && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--nexora-primary)]">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          active
            ? "bg-[var(--nexora-primary)] text-white"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </span>
      <p
        className={`mt-2.5 text-sm font-semibold transition-colors ${
          active ? "text-[var(--nexora-navy)]" : "text-gray-700"
        }`}
      >
        {title}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
    </button>
  );
}