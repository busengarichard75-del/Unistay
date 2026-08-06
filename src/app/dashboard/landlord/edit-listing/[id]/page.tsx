import { getAllProperties } from "@/services/propertyService";
import { EditListingClient } from "@/components/property/EditListingClient";

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

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  return <EditListingClient id={id} />;
}