import { getAllProperties } from "@/services/propertyService";
import { PropertyDetailClient } from "@/components/property/PropertyDetailClient";

export async function generateStaticParams() {
  try {
    const properties = await getAllProperties();
    return properties.map((property) => ({
      id: property.id,
    }));
  } catch {
    return [];
  }
}

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  return <PropertyDetailClient id={id} />;
}