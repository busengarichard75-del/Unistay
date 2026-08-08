"use client";

import Link from "next/link";

export function ConfirmationActions() {
  return (
    <div className="mt-6 flex gap-4 justify-center print:hidden">
      <button
        onClick={() => window.print()}
        className="px-6 py-2 bg-[var(--nexora-primary)] text-white rounded-full hover:bg-[var(--nexora-primary-hover)] transition"
      >
        🖨️ Print Confirmation
      </button>
      <Link
        href="/"
        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
      >
        Home
      </Link>
    </div>
  );
}