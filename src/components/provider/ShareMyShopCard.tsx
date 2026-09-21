"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Share2, Copy, QrCode, Sparkles } from "lucide-react";
import { ShareQRModal } from "./ShareQRModal";

interface ShareMyShopCardProps {
  /** Provider's Firebase UID — used to build the public shop URL */
  uid: string;
  /** Business name or display name shown on the shop */
  displayName: string;
  /** Optional small line under the title, e.g. "12 services · 5 products" */
  hint?: string;
}

/**
 * Prominent "Share My Shop" card for the provider dashboard.
 *
 * The single best growth tool on Peza: every time a provider shares their
 * shop link, THEY are advertising Peza for us. Zero cost, high trust.
 *
 * Three actions:
 *   - Share       → native share sheet (WhatsApp, SMS, etc.)
 *   - Copy link   → clipboard
 *   - View QR     → full-screen QR modal (for printing)
 */
export function ShareMyShopCard({ uid, displayName, hint }: ShareMyShopCardProps) {
  const [shopUrl, setShopUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Build the URL client-side so it always matches the real domain
  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    setShopUrl(`${origin}/provider/${uid}`);
  }, [uid]);

  const shareText = `${displayName} on Peza — services, products, and more. Tap to browse:`;

  async function handleShare() {
    if (!shopUrl) return;

    // Native share sheet on mobile, clipboard fallback on desktop
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${displayName} on Peza`,
          text: shareText,
          url: shopUrl,
        });
        return;
      } catch {
        // User cancelled or share failed → fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shopUrl}`);
      setCopied(true);
      toast.success("Link copied — paste it anywhere!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not share. Try copying the link manually.");
    }
  }

  async function handleCopy() {
    if (!shopUrl) return;
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  // Small inline QR for the card itself
  const inlineQr = shopUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(
        shopUrl
      )}`
    : "";

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-indigo-100/70 px-5 pt-5 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            <Share2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[var(--nexora-navy)]">
              📣 Share My Shop
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
              Get more customers by sharing your Peza shop link. Everyone who
              clicks sees <strong>all</strong> your listings at once.
            </p>
            {hint && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700">
                <Sparkles size={11} />
                {hint}
              </p>
            )}
          </div>
        </div>

        {/* URL + inline QR + actions */}
        <div className="px-5 py-4">
          <div className="flex items-start gap-4">
            {/* Inline QR preview (clickable → opens modal) */}
            {inlineQr && (
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="group relative shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-1.5 transition-colors hover:border-indigo-400"
                aria-label="View full QR code"
                title="Tap to enlarge"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inlineQr}
                  alt="Shop QR"
                  width={76}
                  height={76}
                  className="h-[76px] w-[76px]"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                  <QrCode size={18} className="text-white" />
                </span>
              </button>
            )}

            {/* URL block */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Your shop link
              </p>
              <p className="mt-1 truncate rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                {shopUrl || "Building link…"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleShare}
              disabled={!shopUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              <Share2 size={14} />
              Share
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!shopUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy link"}
            </button>

            <button
              type="button"
              onClick={() => setShowQR(true)}
              disabled={!shopUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <QrCode size={14} />
              View QR
            </button>
          </div>

          {/* Small tip */}
          <p className="mt-3 text-[11px] text-gray-500">
            💡 Print your QR and tape it on your stall, mirror, or business card —
            students can scan and order directly.
          </p>
        </div>
      </div>

      {/* Full-screen QR modal */}
      {showQR && shopUrl && (
        <ShareQRModal
          url={shopUrl}
          shopName={displayName}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  );
}