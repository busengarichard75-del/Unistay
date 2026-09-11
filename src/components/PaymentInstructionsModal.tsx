// src/components/PaymentInstructionsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Phone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Booking } from "@/types/booking";
import { BookingCountdown } from "@/components/BookingCountdown";

const PAYMENT_NUMBER_INTL = "+260 0771319817";
const PAYMENT_NUMBER_INTL_RAW = "+2600771319817";
const PAYMENT_NUMBER_LOCAL = "0771319817";
const AGENT_FEE = "K100";
const SUPPORT_PHONE_DISPLAY = "+260 0771319817";
const SUPPORT_PHONE_TEL = "+2600771319817";

function referenceFor(bookingId: string) {
  return `PEZA-${bookingId.slice(-6).toUpperCase()}`;
}

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export function PaymentInstructionsModal({
  isOpen,
  onClose,
  booking,
}: PaymentInstructionsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reference = referenceFor(booking.id);

  async function copy(text: string, key: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(key);
      toast.success("Copied!");
      setTimeout(() => {
        setCopied((c) => (c === key ? null : c));
      }, 1500);
    } catch {
      toast.error("Couldn't copy. Please copy manually.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-3 py-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <h3 className="text-base font-bold text-[var(--nexora-navy)]">
            Pay Agent Fee
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount */}
          <div className="rounded-xl bg-gradient-to-br from-[var(--nexora-primary)] to-[var(--nexora-navy)] p-4 text-white">
            <p className="text-xs text-white/70">Amount to pay</p>
            <p className="mt-0.5 text-3xl font-bold">{AGENT_FEE}</p>
            <p className="mt-1 text-xs text-white/80">
              Agent fee for{" "}
              <span className="font-medium">{booking.propertyTitle}</span>
            </p>
          </div>

          {/* Send to */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500">Send to</p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-gray-900">
                    {PAYMENT_NUMBER_INTL}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    or <span className="font-mono">{PAYMENT_NUMBER_LOCAL}</span> if
                    your app doesn&apos;t accept +260
                  </p>
                </div>
                <button
                  onClick={() => copy(PAYMENT_NUMBER_INTL_RAW, "number")}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
                  aria-label="Copy payment number"
                >
                  {copied === "number" ? <Check size={12} /> : <Copy size={12} />}
                  {copied === "number" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              Reference{" "}
              <span className="text-gray-400">
                (use this so we can match your payment)
              </span>
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {reference}
                </p>
                <button
                  onClick={() => copy(reference, "ref")}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
                  aria-label="Copy reference code"
                >
                  {copied === "ref" ? <Check size={12} /> : <Copy size={12} />}
                  {copied === "ref" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* How to pay */}
          <div className="rounded-xl bg-blue-50 p-3.5">
            <p className="mb-2 text-xs font-semibold text-blue-900">
              How to pay
            </p>
            <ol className="space-y-1.5 text-xs text-blue-800">
              <li>1. Open your mobile money app (Airtel Money · MTN · Zamtel)</li>
              <li>
                2. Send <strong>{AGENT_FEE}</strong> to the number above
              </li>
              <li>3. Use the reference above as the payment reference</li>
              <li>4. Admin verifies and confirms your booking shortly</li>
            </ol>
          </div>

          {/* Urgency */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <AlertCircle size={12} />
              Pay before this expires
            </p>
            <BookingCountdown booking={booking} />
          </div>

          {/* Support */}
          <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <Phone size={12} className="text-[var(--nexora-primary)]" />
            <span>Need help?</span>
            <a
              href={`tel:${SUPPORT_PHONE_TEL}`}
              className="font-medium text-[var(--nexora-primary)] hover:underline"
            >
              {SUPPORT_PHONE_DISPLAY}
            </a>
          </div>

          {/* Hide button */}
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[var(--nexora-navy)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}