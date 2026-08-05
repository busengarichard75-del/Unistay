"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProperty } from "@/services/propertyService";
import { Property, PaymentPeriod, GenderPreference, DistanceBucket, Amenities, BedSpace } from "@/types/property";
import { universities } from "@/data/universities";
import { DISTANCE_LABELS } from "@/constants/property";

interface EditListingFormProps {
  property: Property;
}

export function EditListingForm({ property }: EditListingFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(property.title);
  const [price, setPrice] = useState(String(property.price));
  const [paymentPeriod, setPaymentPeriod] = useState<PaymentPeriod>(property.paymentPeriod);
  const [genderPreference, setGenderPreference] = useState<GenderPreference>(property.genderPreference);
  const [distanceBucket, setDistanceBucket] = useState<DistanceBucket>(property.distanceBucket);
  const [universityId, setUniversityId] = useState(property.universityId);
  const [location, setLocation] = useState(property.location);
  const [imageUrl, setImageUrl] = useState(property.imageUrl);
  const [amenities, setAmenities] = useState<Amenities>(property.amenities);
  // NEW: Initialize bedTypes from existing bedSpaces
  const [bedTypes, setBedTypes] = useState<("Top" | "Bottom")[]>(
    property.bedSpaces.map((bed) => (bed.type === "Top" || bed.type === "Bottom") ? bed.type : "Top")
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleAmenity(key: keyof Amenities) {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleBedTypeChange(index: number, value: "Top" | "Bottom") {
    setBedTypes((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Prepare updated bed spaces: preserve id, isAvailable, update type
      const updatedBedSpaces: BedSpace[] = property.bedSpaces.map((bed, index) => ({
        id: bed.id,
        isAvailable: bed.isAvailable,
        type: bedTypes[index] || "Top",
      }));

      await updateProperty(property.id, {
        title,
        price: Number(price),
        paymentPeriod,
        genderPreference,
        distanceBucket,
        universityId,
        location,
        imageUrl,
        amenities,
        bedSpaces: updatedBedSpaces,
      });

      router.push("/dashboard/landlord");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Listing title"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      />

      <select
        value={universityId}
        onChange={(e) => setUniversityId(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      >
        {universities.map((u) => (
          <option key={u.id} value={u.id} disabled={!u.isAvailable}>
            {u.name}{!u.isAvailable ? " (coming soon)" : ""}
          </option>
        ))}
      </select>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Estimated distance to campus
        </label>
        <select
          value={distanceBucket}
          onChange={(e) => setDistanceBucket(e.target.value as DistanceBucket)}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
        >
          {(Object.keys(DISTANCE_LABELS) as DistanceBucket[]).map((key) => (
            <option key={key} value={key}>
              {DISTANCE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      />

      <div className="flex gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (K)"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
        />

        <div className="flex rounded-full border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setPaymentPeriod("monthly")}
            className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              paymentPeriod === "monthly" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPaymentPeriod("termly")}
            className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              paymentPeriod === "termly" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            Termly
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Gender preference</label>
        <div className="flex rounded-full border border-gray-200 p-1">
          {(["male", "female", "mixed"] as GenderPreference[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderPreference(g)}
              className={`flex-1 rounded-full py-2 text-xs font-medium capitalize transition-colors ${
                genderPreference === g ? "bg-blue-600 text-white" : "text-gray-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "electricity", label: "Electricity" },
              { key: "water", label: "Water" },
              { key: "security", label: "Security" },
            ] as { key: keyof Amenities; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleAmenity(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                amenities[key]
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL"
        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none"
      />

      {/* Bed spaces section */}
      {property.bedSpaces.length > 0 && (
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-600">Bed space types (Top / Bottom)</p>
          {property.bedSpaces.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-700">Bed {index + 1}</span>
              <select
                value={bedTypes[index] || "Top"}
                onChange={(e) => handleBedTypeChange(index, e.target.value as "Top" | "Bottom")}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none"
              >
                <option value="Top">Top Bunk</option>
                <option value="Bottom">Bottom Bunk</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}