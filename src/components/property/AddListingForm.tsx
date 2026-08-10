"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/AuthContext";
import { addProperty } from "@/services/propertyService";
import { BedSpace, PaymentPeriod, GenderPreference, DistanceBucket, Amenities, Room } from "@/types/property";
import { universities } from "@/data/universities";
import { DISTANCE_LABELS } from "@/constants/property";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { RoomBuilder } from "@/components/property/RoomBuilder";
import { X, Plus } from "lucide-react";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

export function AddListingForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [paymentPeriod, setPaymentPeriod] = useState<PaymentPeriod>("monthly");
  const [genderPreference, setGenderPreference] = useState<GenderPreference>("mixed");
  const [distanceBucket, setDistanceBucket] = useState<DistanceBucket>("under5");
  const [universityId, setUniversityId] = useState(universities[0].id);
  const [location, setLocation] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<Amenities>({
    electricity: false,
    water: false,
    security: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map state
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // ✅ Rooms state (initial: 1 room with 1 bed)
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: `room-${Date.now()}-1`,
      name: "Room 1",
      bedCount: 1,
      bedSpaces: [
        {
          id: `bed-${Date.now()}-1-1`,
          isAvailable: true,
          type: "Top",
        },
      ],
    },
  ]);

  // ✅ Custom amenities
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

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
    if (!user) return;

    setError("");
    setIsSubmitting(true);

    try {
      // Build bedSpaces from rooms (flatten for Firestore)
      const bedSpaces: BedSpace[] = rooms.flatMap((room) => room.bedSpaces);

      const propertyData: any = {
        ownerId: user.uid,
        universityId,
        title,
        price: Number(price),
        paymentPeriod,
        genderPreference,
        distanceBucket,
        amenities,
        location,
        bedSpaces, // Store flat for backward compatibility (we also store rooms)
        rooms,     // Store rooms structure for new listings
        additionalAmenities: customAmenities,
      };

      if (imageUrls.length > 0) {
        propertyData.imageUrl = imageUrls[0];
        propertyData.imageUrls = imageUrls;
      }

      if (latitude !== undefined && longitude !== undefined) {
        propertyData.latitude = latitude;
        propertyData.longitude = longitude;
      }

      await addProperty(propertyData);

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

      {/* ✅ Rooms & Beds */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Rooms & Bed Spaces</label>
        <RoomBuilder rooms={rooms} onChange={setRooms} />
      </div>

      {/* Map Location Picker */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Property Location (click on map to set)
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
          <p className="text-xs text-gray-400">Click on the map to select the property location.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
      >
        {isSubmitting ? "Creating listing..." : "Create listing"}
      </button>
    </form>
  );
}