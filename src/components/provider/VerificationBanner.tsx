"use client";

import { Clock, AlertTriangle, Phone } from "lucide-react";
import { User } from "@/types/user";

export function VerificationBanner({ user }: { user: User }) {
  const status = user.verificationStatus || "approved";

  if (status === "approved") return null;

  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Verification in progress
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            Our team reviews every provider before they can add listings —
            this usually takes less than 24 hours. You&apos;ll be able to
            add listings once approved.
          </p>
        </div>
      </div>
    );
  }

  // rejected
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-red-900">
          Your account wasn&apos;t approved
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-red-800">
          {user.verificationReason || "Please contact Peza support for details."}
        </p>
        <a
          href="tel:+2600771319817"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:underline"
        >
          <Phone size={12} />
          Contact support: +260 0771319817
        </a>
      </div>
    </div>
  );
}