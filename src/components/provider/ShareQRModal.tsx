"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Download, Copy, QrCode } from "lucide-react";

interface ShareQRModalProps {
  /** The full URL to encode in the QR */
  url: string;
  /** Business name or display name (used for the caption) */
  shopName: string;
  /** Called when the modal should close */
  onClose: () => void;
}

/**
 * Full-screen modal showing a printable QR code for the provider's shop.
 *
 * QR is generated via the free api.qrserver.com service (no npm deps).
 * Provider can:
 *   - Screenshot the QR for printing
 *   - Download as PNG
 *   - Copy the underlying URL
 *   - See usage tips (tape on stall, print on cards, etc.)
 */
export function ShareQRModal({ url, shopName, onClose }: ShareQRModalProps) {
  const [copied, setCopied] = useState(false);

  // qrserver.com — free public API, no auth, works in every browser
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=20&data=${encodeURIComponent(
    url
  )}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — long press the QR to save instead");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm px-3 py-3 sm:items-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Shop QR code"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--nexora-primary)]/10 text-[var(--nexora-primary)]">
              <QrCode size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Shop QR Code</h3>
              <p className="text-[11px] text-gray-500">Scan to open your shop</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {/* QR code */}
          <div className="flex justify-center">
            <div className="rounded-2xl border-4 border-[var(--nexora-navy)] bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`QR code for ${shopName}`}
                width={260}
                height={260}
                className="h-[260px] w-[260px]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Shop name */}
          <p className="mt-3 text-center text-sm font-semibold text-gray-900">
            {shopName}
          </p>
          <p className="mt-0.5 text-center text-[11px] text-gray-400 break-all px-4">
            {url}
          </p>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy link"}
          </button>

          {/* Download button */}
          <a
            href={qrSrc}
            download={`${shopName.replace(/\s+/g, "-").toLowerCase()}-peza-qr.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
          >
            <Download size={14} />
            Download QR image
          </a>

          {/* Tips */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              💡 Ideas for your QR
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-blue-900">
              <li>• Tape it on your stall, mirror, or vehicle</li>
              <li>• Print on business cards or flyers</li>
              <li>• Add to your WhatsApp Status</li>
              <li>• Stick on delivery packaging</li>
              <li>• Students scan → see all your listings → book directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}