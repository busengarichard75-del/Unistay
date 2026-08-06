import { PropertyDetailClient } from "@/components/property/PropertyDetailClient";

export const dynamic = "force-dynamic";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  return <PropertyDetailClient id={id} />;
}