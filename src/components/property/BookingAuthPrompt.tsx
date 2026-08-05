"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface BookingAuthPromptProps {
  onClose: () => void;
}

export function BookingAuthPrompt({ onClose }: BookingAuthPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Sign in to book this bed space
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          You need an account to reserve a bed space on UniStay.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="w-full rounded-lg border border-gray-200 py-2 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}