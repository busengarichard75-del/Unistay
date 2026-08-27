// src/components/NotificationOptIn.tsx
"use client";

import { useState } from "react";
import { Bell, X, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationOptInProps {
  variant?: "banner" | "modal" | "inline";
}

export function NotificationOptIn({ variant = "banner" }: NotificationOptInProps) {
  const { permission, isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === "granted" || isDismissed) {
    return null;
  }

  // If permission is denied, show a different message
  if (permission === "denied") {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
        <div className="flex items-start gap-3">
          <BellOff size={18} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-gray-700">Notifications are blocked</p>
            <p className="text-xs text-gray-500 mt-0.5">
              You can enable notifications in your browser settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant
  if (variant === "banner") {
    return (
      <div className="relative rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 rounded-full p-1 text-gray-400 hover:bg-gray-200/50 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Never miss a booking update</p>
              <p className="text-xs text-gray-600">
                Get notified when landlords approve, reject, or update your booking.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const success = await subscribe();
              if (success) {
                setIsDismissed(true);
              }
            }}
            className="ml-auto shrink-0 rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--nexora-primary-hover)] whitespace-nowrap"
          >
            Enable Notifications
          </button>
        </div>
      </div>
    );
  }

  // Inline variant (for dashboard settings)
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Push Notifications</p>
          <p className="text-xs text-gray-500">
            {isSubscribed
              ? "You are subscribed to push notifications."
              : "Get real-time booking updates."}
          </p>
        </div>
        {isSubscribed ? (
          <button
            onClick={async () => {
              await unsubscribe();
            }}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={async () => {
              await subscribe();
            }}
            className="rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--nexora-primary-hover)] transition-colors"
          >
            Enable
          </button>
        )}
      </div>
    );
  }

  return null;
}