import { PropertyDetailClient } from "@/components/property/PropertyDetailClient";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  return <PropertyDetailClient id={id} />;
}