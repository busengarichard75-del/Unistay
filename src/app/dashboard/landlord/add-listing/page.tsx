"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AddListingForm } from "@/components/property/AddListingForm";

export default function AddListingPage() {
  const { user, isLoading } = useRequireAuth("landlord");

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-narrow">
        <h1 className="mb-6 text-2xl font-bold text-[var(--nexora-text-primary)]">Add a new listing</h1>
        <AddListingForm />
      </div>
    </main>
  );
}