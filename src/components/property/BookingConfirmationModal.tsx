"use client";

import { X, Home, MapPin, BedDouble, Phone, AlertCircle } from "lucide-react";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  property: {
    title: string;
    location: string;
    price: number;
    paymentPeriod: string;
  } | null;
  bedType: string;
  isSubmitting: boolean;
}

const SUPPORT_PHONE = "+260 0771319817";

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  property,
  bedType,
  isSubmitting,
}: BookingConfirmationModalProps) {
  if (!isOpen || !property) return null;

  const periodLabel = property.paymentPeriod === "termly" ? "/term" : "/month";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-center text-xl font-bold text-gray-900">
          Confirm Booking Request
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          Please review the details before sending.
        </p>

        {/* Details Card */}
        <div className="mt-5 space-y-3 rounded-xl bg-[var(--nexora-surface)] p-4">
          {/* Property */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--nexora-primary)]">
              <Home size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Property</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {property.title}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--nexora-primary)]">
              <MapPin size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {property.location}
              </p>
            </div>
          </div>

          {/* Bed */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--nexora-primary)]">
              <BedDouble size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Bed Space</p>
              <p className="text-sm font-medium text-gray-900">{bedType}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-lg font-bold text-gray-900">
                K{property.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">{periodLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            The landlord will be notified and will review your request. The bed
            remains available until approved.
          </span>
        </div>

        {/* Support line */}
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-50 py-2 text-xs text-gray-600">
          <Phone size={12} />
          <span>
            Need help? Call{" "}
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="font-semibold text-[var(--nexora-primary)] hover:underline"
            >
              {SUPPORT_PHONE}
            </a>
          </span>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-primary-hover)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Send Request →"}
          </button>
        </div>
      </div>
    </div>
  );
}