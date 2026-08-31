"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { updateProperty } from "@/services/propertyService";
import { Property, PaymentPeriod, GenderPreference, DistanceBucket, Amenities, BedSpace, Room } from "@/types/property";
import { universities } from "@/data/universities";
import { DISTANCE_LABELS } from "@/constants/property";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { RoomBuilder } from "@/components/property/RoomBuilder";
import { X, Plus, Building, MapPin, Image as ImageIcon, Home, Bed, Wifi, Droplet, Shield, User, Clock, Tag } from "lucide-react";

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

  // Custom amenities state
  const [customAmenities, setCustomAmenities] = useState<string[]>(property.additionalAmenities || []);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  // Rooms state: if property has rooms, use them; otherwise fallback to flat bedSpaces (old listings)
  const hasRooms = property.rooms && property.rooms.length > 0;
  const [rooms, setRooms] = useState<Room[]>(() => {
    if (hasRooms) {
      return property.rooms!;
    }
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

  // For old listings: keep flat bed types state
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
        bedSpaces = rooms.flatMap((room) => room.bedSpaces);
        roomsData = rooms;
      } else {
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

      toast.success("Property updated successfully! 🎉");
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      {/* ─── Section 1: Basic Information ─── */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Home size={18} className="text-[var(--nexora-primary)]" />
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
          <span className="ml-auto text-xs text-gray-400">Step 1 of 5</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Property Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mukuba Student Lodge"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">University / Campus</label>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                  {u.name}{!u.isAvailable ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Distance to Campus</label>
            <select
              value={distanceBucket}
              onChange={(e) => setDistanceBucket(e.target.value as DistanceBucket)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            >
              {(Object.keys(DISTANCE_LABELS) as DistanceBucket[]).map((key) => (
                <option key={key} value={key}>
                  {DISTANCE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Matero, Lusaka"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Price (K)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 1500"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Payment Period</label>
              <div className="flex rounded-xl border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentPeriod("monthly")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    paymentPeriod === "monthly" ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPeriod("termly")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    paymentPeriod === "termly" ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Termly
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPeriod("semester")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    paymentPeriod === "semester" ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Semester
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Gender Preference</label>
            <div className="flex rounded-xl border border-gray-200 p-1">
              {(["male", "female", "mixed"] as GenderPreference[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderPreference(g)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors ${
                    genderPreference === g ? "bg-[var(--nexora-primary)] text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Rooms & Beds ─── */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Bed size={18} className="text-[var(--nexora-primary)]" />
          <h2 className="text-base font-semibold text-gray-900">Rooms & Beds</h2>
          <span className="ml-auto text-xs text-gray-400">Step 2 of 5</span>
        </div>

        {hasRooms ? (
          <RoomBuilder rooms={rooms} onChange={setRooms} />
        ) : (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-600">Bed space types (Top / Bottom)</p>
            {property.bedSpaces?.map((bed, index) => (
              <div key={bed.id} className="flex items-center gap-3">
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
      </section>

      {/* ─── Section 3: Amenities ─── */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Tag size={18} className="text-[var(--nexora-primary)]" />
          <h2 className="text-base font-semibold text-gray-900">Amenities</h2>
          <span className="ml-auto text-xs text-gray-400">Step 3 of 5</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Standard Amenities</label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "electricity", label: "⚡ Electricity" },
                { key: "water", label: "💧 Water" },
                { key: "security", label: "🛡️ Security" },
              ] as { key: keyof Amenities; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleAmenity(key)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                    amenities[key]
                      ? "border-[var(--nexora-primary)] bg-blue-50 text-[var(--nexora-primary)]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Custom Amenities</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAmenityInput}
                onChange={(e) => setCustomAmenityInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., WiFi, Parking, Generator"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="rounded-lg bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--nexora-primary-hover)] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              {customAmenities.length} of 10 used
            </p>
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
        </div>
      </section>

      {/* ─── Section 4: Images ─── */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <ImageIcon size={18} className="text-[var(--nexora-primary)]" />
          <h2 className="text-base font-semibold text-gray-900">Property Images</h2>
          <span className="ml-auto text-xs text-gray-400">Step 4 of 5</span>
        </div>

        <MultiImageUploader
          onUpload={(urls) => setImageUrls(urls)}
          initialImages={imageUrls}
          maxImages={3}
        />
        {imageUrls.length > 0 && (
          <p className="text-xs text-green-600">✓ {imageUrls.length} image(s) uploaded</p>
        )}
      </section>

      {/* ─── Section 5: Location ─── */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <MapPin size={18} className="text-[var(--nexora-primary)]" />
          <h2 className="text-base font-semibold text-gray-900">Property Location</h2>
          <span className="ml-auto text-xs text-gray-400">Step 5 of 5</span>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Click on the map to set location</label>
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
            <p className="mt-2 text-xs text-green-600">
              ✓ Location set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">Click on the map to set the property location.</p>
          )}
        </div>
      </section>

      {/* ─── Error Message ─── */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {/* ─── Submit ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[var(--nexora-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}