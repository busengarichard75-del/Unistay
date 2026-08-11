import Link from "next/link";
import { MapPin, Footprints, BedDouble, ChevronRight, Zap, Droplet, ShieldCheck, Star } from "lucide-react";
import { Property } from "@/types/property";
import { DISTANCE_LABELS } from "@/constants/property";
import { isBoosted } from "@/lib/boostService";

interface PropertyCardProps {
  property: Property;
}

function getAvailabilityStatus(availableCount: number) {
  if (availableCount === 0) {
    return { label: "Full", color: "var(--nexora-danger)", bg: "var(--nexora-danger-bg)" };
  }
  if (availableCount <= 2) {
    return {
      label: `${availableCount} bed${availableCount > 1 ? "s" : ""} left`,
      color: "var(--nexora-warning)",
      bg: "var(--nexora-warning-bg)",
    };
  }
  return {
    label: `${availableCount} beds available`,
    color: "var(--nexora-success)",
    bg: "var(--nexora-success-bg)",
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { id, title, price, paymentPeriod, location, bedSpaces, genderPreference, distanceBucket, amenities, imageUrl, imageUrls } =
    property;

  const primaryImage = imageUrls?.[0] || imageUrl || null;
  const hasMultiple = imageUrls && imageUrls.length > 1;
  const availableCount = (bedSpaces ?? []).filter((bed) => bed.isAvailable).length;
  const periodLabel = paymentPeriod === "termly" ? "/term" : "/mo";
  const status = getAvailabilityStatus(availableCount);
  const hasAnyAmenity = amenities && (amenities.electricity || amenities.water || amenities.security);
  const boosted = isBoosted(property);
  const isVerified = property.verificationStatus === "approved";

  return (
    <Link
      href={`/property/${id}`}
      className="block rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md relative"
    >
      {/* Boosted Badge */}
      {boosted && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black shadow-sm">
          <Star size={14} fill="currentColor" />
          Boosted
        </div>
      )}

      {primaryImage && (
        <div className="relative mb-4 overflow-hidden rounded-xl">
          <img
            src={primaryImage}
            alt={title}
            className="h-48 w-full object-cover"
          />
          {hasMultiple && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              +{imageUrls.length - 1} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 sm:text-lg">
          {title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap text-lg font-bold text-gray-900">
            K{price.toLocaleString()}
            <span className="text-sm font-normal text-gray-500">{periodLabel}</span>
          </span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
      </div>

      <div className="mt-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          <BedDouble size={13} />
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        {distanceBucket && (
          <span className="flex items-center gap-1">
            <Footprints size={13} />
            {DISTANCE_LABELS[distanceBucket]}
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin size={13} />
          {location}
        </span>
        {genderPreference && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium capitalize text-gray-600">
            {genderPreference}
          </span>
        )}
      </div>

      {hasAnyAmenity && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {amenities.electricity && (
            <span className="flex items-center gap-1">
              <Zap size={13} />
              Electricity
            </span>
          )}
          {amenities.water && (
            <span className="flex items-center gap-1">
              <Droplet size={13} />
              Water
            </span>
          )}
          {amenities.security && (
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} />
              Security
            </span>
          )}
        </div>
      )}

      {/* ✅ UniStay Verified Badge */}
      {isVerified && (
        <div className="mt-2 flex items-center gap-1.5">
          <Star size={14} className="fill-blue-600 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">UniStay Verified</span>
        </div>
      )}
    </Link>
  );
}