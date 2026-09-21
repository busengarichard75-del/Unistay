"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { stripUndefined } from "@/lib/stripUndefined";
import { SHOP_THEMES, TAGLINE_MAX_LENGTH, getShopTheme } from "@/lib/shopThemes";
import type { ShopSettings, ShopAccentColor } from "@/types/user";
import type { Service } from "@/types/service";
import type { Product } from "@/types/product";
import {
  Palette,
  Type,
  Image as ImageIcon,
  Star,
  Save,
  Loader2,
  X,
  Check,
} from "lucide-react";

interface ShopAppearanceEditorProps {
  /** All of the provider's services — used for the "featured listing" picker */
  services: Service[];
  /** All of the provider's products — used for the "featured listing" picker */
  products: Product[];
}

/**
 * Provider-only card that lets the owner customize their shop:
 *   - Accent color (6 presets)
 *   - Tagline (max 80 chars)
 *   - Banner image (optional)
 *   - Featured listing (pin one service or product)
 *
 * Auto-saves to Firestore under users/{uid}.shopSettings, then
 * refreshes the auth context so the shop page picks up the changes.
 */
export function ShopAppearanceEditor({
  services,
  products,
}: ShopAppearanceEditorProps) {
  const { user, refreshUser } = useAuth();
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Local state — initialized from user.shopSettings
  const [accentColor, setAccentColor] = useState<ShopAccentColor>("indigo");
  const [tagline, setTagline] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();
  const [featuredListingId, setFeaturedListingId] = useState<string | undefined>();
  const [featuredListingType, setFeaturedListingType] = useState<
    "service" | "product" | undefined
  >();

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [original, setOriginal] = useState<ShopSettings>({});

  // Load existing settings
  useEffect(() => {
    if (!user) return;
    const s = user.shopSettings || {};
    setAccentColor(s.accentColor || "indigo");
    setTagline(s.tagline || "");
    setBannerUrl(s.bannerUrl);
    setFeaturedListingId(s.featuredListingId);
    setFeaturedListingType(s.featuredListingType);
    setOriginal(s);
  }, [user]);

  const theme = getShopTheme(accentColor);

  // Detect changes vs. original
  const hasChanges =
    accentColor !== (original.accentColor || "indigo") ||
    tagline.trim() !== (original.tagline || "") ||
    bannerUrl !== original.bannerUrl ||
    featuredListingId !== original.featuredListingId ||
    featuredListingType !== original.featuredListingType;

  // ─── Banner upload ───
  async function handleBannerPick(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Banner must be under 8 MB.");
      return;
    }

    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const url: string | undefined =
        data?.url || data?.secure_url || data?.data?.url;
      if (!url) throw new Error("No URL returned");

      setBannerUrl(url);
      toast.success("Banner added — don't forget to save.");
    } catch (err) {
      console.error("Banner upload failed:", err);
      toast.error("Failed to upload banner. Please try again.");
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleBannerPick(file);
  }

  function clearBanner() {
    setBannerUrl(undefined);
  }

  // ─── Featured listing helpers ───
  const featuredKey = featuredListingId && featuredListingType
    ? `${featuredListingType}:${featuredListingId}`
    : "";

  function handleFeaturedChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) {
      setFeaturedListingId(undefined);
      setFeaturedListingType(undefined);
      return;
    }
    const [type, id] = value.split(":");
    if (type === "service" || type === "product") {
      setFeaturedListingType(type);
      setFeaturedListingId(id);
    }
  }

  // ─── Save ───
  async function handleSave() {
    if (!user) return;

    const trimmedTagline = tagline.trim();
    if (trimmedTagline.length > TAGLINE_MAX_LENGTH) {
      toast.error(`Tagline must be ${TAGLINE_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setIsSaving(true);
    try {
      const nextSettings: ShopSettings = stripUndefined({
        accentColor,
        tagline: trimmedTagline || undefined,
        bannerUrl: bannerUrl || undefined,
        featuredListingId: featuredListingId || undefined,
        featuredListingType: featuredListingType || undefined,
      }) as ShopSettings;

      await updateDoc(doc(db, "users", user.uid), {
        shopSettings: nextSettings,
      });

      setOriginal(nextSettings);

      // Refresh auth context so /provider/[uid] picks up the changes
      if (refreshUser) await refreshUser();

      toast.success("Shop appearance saved!");
    } catch (err) {
      console.error("Failed to save shop settings:", err);
      toast.error("Could not save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50";

  const hasListings = services.length > 0 || products.length > 0;

  return (
    <section className="card-premium mt-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 pt-6 pb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--nexora-navy)]">
          <Palette size={16} /> Shop Appearance
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Make your shop stand out. These changes appear on your public shop
          page.
        </p>
      </div>

      {/* Live preview */}
      <div className="px-6 pt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Preview
        </p>
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} px-5 py-6 text-white shadow-md`}
        >
          {bannerUrl && (
            <>
              <img
                src={bannerUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          )}
          <div className="relative">
            <p className="text-[10px] uppercase tracking-wider text-white/80">
              Your shop
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {user?.businessName || user?.fullName || "Your Shop"}
            </p>
            {tagline.trim() && (
              <p className="mt-1 text-xs text-white/90">{tagline.trim()}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 pt-5 pb-6">
        {/* Accent color */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Palette size={13} className="text-gray-400" /> Accent color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {SHOP_THEMES.map((t) => {
              const active = accentColor === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAccentColor(t.id)}
                  title={t.label}
                  className={`group relative aspect-square overflow-hidden rounded-xl ring-2 transition-all ${t.swatch} ${
                    active
                      ? "ring-gray-900 ring-offset-2"
                      : "ring-transparent hover:ring-gray-300"
                  }`}
                  aria-label={`Use ${t.label} theme`}
                >
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Sets the header color of your shop page.
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Type size={13} className="text-gray-400" /> Tagline
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) =>
              setTagline(e.target.value.slice(0, TAGLINE_MAX_LENGTH))
            }
            placeholder="e.g., Fresh cuts, fast service — near MUKUBA"
            disabled={isSaving}
            className={inputClass}
            maxLength={TAGLINE_MAX_LENGTH}
          />
          <p className="mt-1 text-right text-[11px] text-gray-400">
            {tagline.length} / {TAGLINE_MAX_LENGTH}
          </p>
        </div>

        {/* Banner */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <ImageIcon size={13} className="text-gray-400" /> Banner image
            (optional)
          </label>
          {bannerUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-200">
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="h-28 w-full object-cover"
              />
              <button
                type="button"
                onClick={clearBanner}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
                aria-label="Remove banner"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner || isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-5 text-sm font-medium text-gray-600 transition-colors hover:border-[var(--nexora-primary)] hover:bg-blue-50/40 disabled:opacity-60"
            >
              {isUploadingBanner ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <ImageIcon size={16} />
                  Add a banner
                </>
              )}
            </button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
          <p className="mt-1.5 text-[11px] text-gray-400">
            Wide image (~1600×400). Optional — your accent color shows through
            if you skip it.
          </p>
        </div>

        {/* Featured listing */}
        {hasListings && (
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <Star size={13} className="text-gray-400" /> Featured listing
              (optional)
            </label>
            <select
              value={featuredKey}
              onChange={handleFeaturedChange}
              disabled={isSaving}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Nothing pinned — show newest first</option>
              {services.length > 0 && (
                <optgroup label="Services">
                  {services.map((s) => (
                    <option key={s.id} value={`service:${s.id}`}>
                      {s.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {products.length > 0 && (
                <optgroup label="Products">
                  {products.map((p) => (
                    <option key={p.id} value={`product:${p.id}`}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="mt-1.5 text-[11px] text-gray-400">
              Pin one listing to the top of your shop — great for your best
              seller or a promo.
            </p>
          </div>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--nexora-primary)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save size={16} />
              {hasChanges ? "Save appearance" : "No changes to save"}
            </>
          )}
        </button>
      </div>
    </section>
  );
}