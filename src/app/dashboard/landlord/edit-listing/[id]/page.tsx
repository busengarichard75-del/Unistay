import { EditListingClient } from "@/components/property/EditListingClient";

export const dynamic = "force-dynamic";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const { id } = await params;

  return <EditListingClient id={id} />;
}