import { PropertyCard } from "./PropertyCard";
import { Property } from "@/types/property";

interface PropertyGridProps {
  properties: Property[];
}

export function PropertyGrid({ properties }: PropertyGridProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-8">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}