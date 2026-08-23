"use client";

import { useParams } from "next/navigation";
import { PropertyDetailClient } from "@/components/property/PropertyDetailClient";
import { PageTransition } from "@/components/PageTransition";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <PageTransition>
      <PropertyDetailClient id={params.id} />
    </PageTransition>
  );
}