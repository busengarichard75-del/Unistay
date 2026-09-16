"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { BackButton } from "@/components/ui/BackButton";
import { getServiceById } from "@/services/serviceService";
import { getProductById } from "@/services/productService";
import { Service } from "@/types/service";
import { Product } from "@/types/product";
import { EditListingForm } from "@/components/provider/EditListingForm";

type ListingType = "service" | "product";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ type: string; id: string }>();
  const { user, isLoading } = useRequireAuth("service_provider");

  const [service, setService] = useState<Service | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type = params?.type as ListingType | undefined;
  const id = params?.id;

  useEffect(() => {
    if (!id || !type) return;
    if (type !== "service" && type !== "product") {
      setError("Invalid listing type.");
      setIsFetching(false);
      return;
    }
    if (!user) return;

    let active = true;
    const load = async () => {
      try {
        if (type === "service") {
          const data = await getServiceById(id);
          if (!active) return;
          if (!data) {
            setError("Service not found.");
          } else if (data.ownerId !== user.uid) {
            setError("You don't have permission to edit this listing.");
          } else {
            setService(data);
          }
        } else {
          const data = await getProductById(id);
          if (!active) return;
          if (!data) {
            setError("Product not found.");
          } else if (data.ownerId !== user.uid) {
            setError("You don't have permission to edit this listing.");
          } else {
            setProduct(data);
          }
        }
      } catch {
        if (active) setError("Failed to load listing.");
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, type, user]);

  if (isLoading || isFetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
        <div className="container-narrow">
          <div className="mb-4">
            <BackButton />
          </div>
          <div className="card-premium p-8 text-center">
            <p className="text-sm text-gray-700">{error}</p>
            <button
              onClick={() => router.push("/dashboard/provider")}
              className="mt-4 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
            >
              ← Back to My Listings
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isService = type === "service";
  const title = isService ? "Edit Service" : "Edit Product";

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-narrow">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-[var(--nexora-text-primary)]">
          {title}
        </h1>

        {isService && service && (
          <EditListingForm type="service" initialService={service} />
        )}
        {!isService && product && (
          <EditListingForm type="product" initialProduct={product} />
        )}
      </div>
    </main>
  );
}