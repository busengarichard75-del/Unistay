// src/components/ConfirmationCelebration.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { Booking } from "@/types/booking";

interface ConfirmationCelebrationProps {
  booking: Booking | null;
  onDismiss: () => void;
}

export function ConfirmationCelebration({ booking, onDismiss }: ConfirmationCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (booking) {
      setVisible(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [booking, onDismiss]);

  if (!booking || !visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
        {/* Close button */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="absolute top-3 right-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Booking Confirmed! 🎉</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your accommodation at <strong>{booking.propertyTitle}</strong> is now reserved.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            A confirmation pass has been sent to your dashboard.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={`/booking/confirmation/${booking.id}`}
              target="_blank"
              className="rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
            >
              View Booking Pass →
            </Link>
            <button
              onClick={() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}