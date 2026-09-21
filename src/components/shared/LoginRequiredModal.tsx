"use client";

import Link from "next/link";
import { X, Lock, ShieldCheck, Zap } from "lucide-react";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Custom heading. Defaults to "Sign in to continue". */
  title?: string;
  /** Custom subtitle explaining why login is needed. */
  subtitle?: string;
}

/**
 * Reusable "you must be logged in" prompt.
 *
 * Used by any feature that requires a real account (e.g. contacting a
 * provider). Preserves the current path so after login the user can
 * return to what they were doing.
 */
export function LoginRequiredModal({
  isOpen,
  onClose,
  title = "Sign in to continue",
  subtitle = "Peza requires an account for this action — it keeps providers and students safer.",
}: LoginRequiredModalProps) {
  if (!isOpen) return null;

  // Preserve current path (and query, so UTM data survives) for return
  const returnPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";

  const encoded = encodeURIComponent(returnPath);
  const loginHref = `/login?redirect=${encoded}`;
  const signupHref = `/signup?redirect=${encoded}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm px-3 py-3 sm:items-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Login required"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-8 pb-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Lock size={26} />
            </div>
            <h2 className="mt-3 text-lg font-bold">{title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-center text-sm leading-relaxed text-gray-600">
            {subtitle}
          </p>

          {/* Trust row */}
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="flex items-center gap-2 text-[11px] text-gray-600">
              <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
              Protects students from fake or abusive contacts
            </p>
            <p className="flex items-center gap-2 text-[11px] text-gray-600">
              <Zap size={13} className="shrink-0 text-indigo-500" />
              One account, all of Peza — rooms, services, marketplace
            </p>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={loginHref}
              className="w-full rounded-xl bg-[var(--nexora-primary)] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
            >
              Log In
            </Link>
            <Link
              href={signupHref}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>

          <p className="mt-3 text-center text-[11px] text-gray-400">
            Takes less than a minute.
          </p>
        </div>
      </div>
    </div>
  );
}