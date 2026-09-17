"use client";

import { useState } from "react";
import { X, Sparkles, Copy, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { BOOST_TIERS, BoostDuration } from "@/types/service";

const PAYMENT_NUMBER_DISPLAY = "+260 0771319817";
const PAYMENT_NUMBER_RAW = "260771319817";

interface BoostListingModalProps {
  listingId: string;
  listingTitle: string;
  listingType: "service" | "product";
  onClose: () => void;
  onConfirm: (duration: BoostDuration, amount: number) => Promise<void>;
}

export function BoostListingModal({
  listingId,
  listingTitle,
  listingType,
  onClose,
  onConfirm,
}: BoostListingModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<BoostDuration>("weekly");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const reference = `BOOST-${listingId.slice(-6).toUpperCase()}`;
  const selectedTier = BOOST_TIERS.find((t) => t.id === selectedDuration)!;

  async function copyNumber() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(PAYMENT_NUMBER_RAW);
      } else {
        const ta = document.createElement("textarea");
        ta.value = PAYMENT_NUMBER_RAW;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("Number copied!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Please copy manually.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-3 py-3 sm:px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative rounded-t-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-base font-bold">Boost this listing</h3>
              <p className="text-xs text-white/80">Get seen first</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Listing */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs text-gray-500">You&apos;re boosting</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
              {listingTitle}
            </p>
          </div>

          {/* Duration picker */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-600">
              Choose duration
            </p>
            <div className="space-y-2">
              {BOOST_TIERS.map((tier) => {
                const active = selectedDuration === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedDuration(tier.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      active
                        ? "border-amber-500 bg-amber-50/60"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          active
                            ? "border-amber-500 bg-amber-500"
                            : "border-gray-300"
                        }`}
                      >
                        {active && <Check size={12} className="text-white" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            active ? "text-amber-900" : "text-gray-800"
                          }`}
                        >
                          {tier.label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {tier.id === "daily" && "24 hours of priority"}
                          {tier.id === "weekly" && "7 days of priority"}
                          {tier.id === "monthly" && "30 days of priority"}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold ${
                        active ? "text-amber-700" : "text-gray-700"
                      }`}
                    >
                      K{tier.amount.toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount summary */}
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white">
            <p className="text-xs text-white/80">You&apos;ll pay</p>
            <p className="mt-0.5 text-3xl font-bold">
              K{selectedTier.amount.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-white/80">
              {selectedTier.label} boost · {selectedTier.id === "daily" && "24h"}
              {selectedTier.id === "weekly" && "7 days"}
              {selectedTier.id === "monthly" && "30 days"}
            </p>
          </div>

          {/* Payment details */}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Send to</p>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {PAYMENT_NUMBER_DISPLAY}
                </p>
                <button
                  onClick={copyNumber}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                Reference (use this)
              </p>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {reference}
                </p>
              </div>
            </div>
          </div>

          {/* How to pay */}
          <div className="rounded-xl bg-blue-50 p-3.5">
            <p className="mb-2 text-xs font-semibold text-blue-900">
              How to boost
            </p>
            <ol className="space-y-1.5 text-xs text-blue-800">
              <li>1. Send K{selectedTier.amount.toFixed(2)} to the number above</li>
              <li>2. Use the reference shown</li>
              <li>3. Tap &quot;I&apos;ve Paid&quot; below</li>
              <li>4. Peza reviews and activates within a few hours</li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await onConfirm(selectedDuration, selectedTier.amount);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles size={14} />
                {loading ? "Sending request..." : "I've Paid — Request Activation"}
              </span>
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}