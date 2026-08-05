"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPropertyById } from "@/services/propertyService";
import { EditListingForm } from "@/components/property/EditListingForm";
import { Property } from "@/types/property";

interface EditListingPageProps {
  params: { id: string };
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const { user, isLoading } = useRequireAuth("landlord");
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(params.id);
        if (!data) {
          notFound();
        }
        // Ensure the logged-in landlord owns this property
        if (data.ownerId !== user.uid) {
          router.push("/dashboard/landlord");
          return;
        }
        setProperty(data);
      } catch {
        setError("Failed to load listing. Please try again.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProperty();
  }, [user, params.id, router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (isFetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-12 w-80 rounded bg-gray-200" />
          <div className="h-12 w-80 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>
      </main>
    );
  }

  if (!property) return notFound();

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-narrow">
        <h1 className="mb-6 text-2xl font-bold text-[var(--nexora-text-primary)]">Edit Listing</h1>
        <EditListingForm property={property} />
      </div>
    </main>
  );
}