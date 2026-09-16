"use client";

import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { BackButton } from "@/components/ui/BackButton";
import { AddListingForm } from "@/components/provider/AddListingForm";
import { Clock } from "lucide-react";

export default function AddListingPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth("service_provider");

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const status = user.verificationStatus || "approved";

  // Block unverified providers
  if (status !== "approved") {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
        <div className="container-narrow">
          <div className="mb-4">
            <BackButton />
          </div>
          <div className="card-premium p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Clock size={22} />
            </div>
            <p className="text-sm font-semibold text-[var(--nexora-text-primary)]">
              {status === "pending"
                ? "Your account is under review"
                : "Your account needs attention"}
            </p>
            <p className="mt-2 text-xs text-[var(--nexora-text-secondary)]">
              {status === "pending"
                ? "Our team reviews every provider before they can add listings. This usually takes less than 24 hours."
                : "Please contact Peza support to resolve this before adding listings."}
            </p>
            <button
              onClick={() => router.push("/dashboard/provider")}
              className="mt-5 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-narrow">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-[var(--nexora-text-primary)]">
          Add a new listing
        </h1>
        <AddListingForm />
      </div>
    </main>
  );
}