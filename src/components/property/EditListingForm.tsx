"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { updateProperty } from "@/services/propertyService";
import { Property, PaymentPeriod, GenderPreference, DistanceBucket, Amenities, BedSpace, Room } from "@/types/property";
import { universities } from "@/data/universities";
import { DISTANCE_LABELS } from "@/constants/property";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { RoomBuilder } from "@/components/property/RoomBuilder";
import { X, Plus } from "lucide-react";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

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
  const [amenities, setAmenities] = useState<Amenities>(property.amenities);

  // Image state
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      return property.imageUrls;
    }
    if (property.imageUrl) {
      return [property.imageUrl];
    }
    return [];
  });

  // Map state
  const [latitude, setLatitude] = useState<number | undefined>(property.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(property.longitude);

  // ✅ Custom amenities state
  const [customAmenities, setCustomAmenities] = useState<string[]>(property.additionalAmenities || []);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  // ✅ Rooms state: if property has rooms, use them; otherwise fallback to flat bedSpaces (old listings)
  const hasRooms = property.rooms && property.rooms.length > 0;
  const [rooms, setRooms] = useState<Room[]>(() => {
    if (hasRooms) {
      return property.rooms!;
    }
    // Fallback: convert flat bedSpaces to a single room (for backward compatibility)
    const bedSpaces = property.bedSpaces || [];
    if (bedSpaces.length === 0) {
      return [
        {
          id: `room-${Date.now()}-1`,
          name: "Room 1",
          bedCount: 0,
          bedSpaces: [],
        },
      ];
    }
    return [
      {
        id: `room-${Date.now()}-1`,
        name: "Room 1",
        bedCount: bedSpaces.length,
        bedSpaces: bedSpaces.map((bed) => ({
          ...bed,
          type: bed.type || "Top",
        })),
      },
    ];
  });

  // ✅ For old listings: keep flat bed types state
  const [bedTypes, setBedTypes] = useState<("Top" | "Bottom")[]>(() => {
    if (hasRooms) return [];
    const beds = property.bedSpaces || [];
    return beds.map((bed) => (bed.type === "Top" || bed.type === "Bottom") ? bed.type : "Top");
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleAmenity(key: keyof Amenities) {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Custom amenity handlers
  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (!trimmed) return;
    if (customAmenities.includes(trimmed)) {
      setError("This amenity is already added.");
      return;
    }
    if (customAmenities.length >= 10) {
      setError("Maximum 10 custom amenities allowed.");
      return;
    }
    setCustomAmenities((prev) => [...prev, trimmed]);
    setCustomAmenityInput("");
    setError("");
  };

  const handleRemoveCustomAmenity = (index: number) => {
    setCustomAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomAmenity();
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let bedSpaces: BedSpace[];
      let roomsData: Room[] | undefined;

      if (hasRooms) {
        // New room-based listing
        bedSpaces = rooms.flatMap((room) => room.bedSpaces);
        roomsData = rooms;
      } else {
        // Old flat listing: use bedTypes
        const types = bedTypes;
        bedSpaces = property.bedSpaces?.map((bed, index) => ({
          id: bed.id,
          isAvailable: bed.isAvailable,
          type: types[index] || "Top",
        })) || [];
        roomsData = undefined;
      }

      const updatePayload: any = {
        title,
        price: Number(price),
        paymentPeriod,
        genderPreference,
        distanceBucket,
        universityId,
        location,
        amenities,
        bedSpaces,
        additionalAmenities: customAmenities,
      };

      // Only include rooms for new-style listings
      if (roomsData) {
        updatePayload.rooms = roomsData;
      }

      if (imageUrls.length > 0) {
        updatePayload.imageUrl = imageUrls[0];
        updatePayload.imageUrls = imageUrls;
      } else {
        updatePayload.imageUrl = null;
        updatePayload.imageUrls = [];
      }

      if (latitude !== undefined && longitude !== undefined) {
        updatePayload.latitude = latitude;
        updatePayload.longitude = longitude;
      } else {
        updatePayload.latitude = null;
        updatePayload.longitude = null;
      }

      await updateProperty(property.id, updatePayload);

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
        placeholder="Location (e.g., 'Matero, Lusaka')"
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

      {/* ✅ Custom Amenities Input */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">Custom Amenities</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customAmenityInput}
            onChange={(e) => setCustomAmenityInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., WiFi, Parking, Generator"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
          />
          <button
            type="button"
            onClick={handleAddCustomAmenity}
            className="rounded-lg bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--nexora-primary-hover)] transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        {customAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {customAmenities.map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomAmenity(index)}
                  className="rounded-full p-0.5 hover:bg-blue-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image Upload */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Property Images (max 3)</label>
        <MultiImageUploader
          onUpload={(urls) => setImageUrls(urls)}
          initialImages={imageUrls}
          maxImages={3}
        />
        {imageUrls.length > 0 && (
          <p className="text-xs text-gray-400">{imageUrls.length} image(s) uploaded</p>
        )}
      </div>

      {/* ✅ Rooms & Beds – conditional rendering */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Rooms & Bed Spaces</label>
        {hasRooms ? (
          <RoomBuilder rooms={rooms} onChange={setRooms} />
        ) : (
          // Old flat bed space input (backward compatibility)
          <div className="space-y-2 rounded-lg border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-600">Bed space types (Top / Bottom)</p>
            {property.bedSpaces?.map((bed, index) => (
              <div key={bed.id} className="flex items-center gap-2">
                <span className="w-24 text-sm text-gray-700">Bed {index + 1}</span>
                <select
                  value={bedTypes[index] || "Top"}
                  onChange={(e) => {
                    const updated = [...bedTypes];
                    updated[index] = e.target.value as "Top" | "Bottom";
                    setBedTypes(updated);
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none"
                >
                  <option value="Top">Top Bunk</option>
                  <option value="Bottom">Bottom Bunk</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Location Picker */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Property Location (click on map to update)
        </label>
        <PropertyMap
          selectable
          onLocationSelect={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
          latitude={latitude}
          longitude={longitude}
          height="250px"
        />
        {latitude !== undefined && longitude !== undefined ? (
          <p className="text-xs text-green-600">
            ✓ Location set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        ) : (
          <p className="text-xs text-gray-400">Click on the map to set the property location.</p>
        )}
      </div>

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