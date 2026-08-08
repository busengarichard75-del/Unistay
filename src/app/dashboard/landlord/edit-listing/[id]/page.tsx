import { EditListingClient } from "@/components/property/EditListingClient";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const { id } = await params;
  return <EditListingClient id={id} />;
}