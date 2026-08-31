"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { addProperty } from "@/services/propertyService";
import { BedSpace, PaymentPeriod, GenderPreference, DistanceBucket, Amenities, Room } from "@/types/property";
import { universities } from "@/data/universities";
import { DISTANCE_LABELS } from "@/constants/property";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { RoomBuilder } from "@/components/property/RoomBuilder";
import { X, Plus, Home, MapPin, Image as ImageIcon, Bed, Tag, User, Clock, Building } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

const PropertyMap = dynamic(
  () => import("@/components/map/PropertyMap").then((mod) => mod.PropertyMap),
  { ssr: false }
);

export function AddListingForm() {
  const { user } = useAuth();
  const router = useRouter();
  const userLocation = useGeolocation();

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

  // Rooms state (initial: 1 room with 1 bed)
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

  // Custom amenities
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
        bedSpaces,
        rooms,
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

      toast.success("Property added successfully! 🎉");
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

  // Determine default map center: user location → Lusaka fallback
  const defaultCenter: [number, number] | undefined =
    userLocation.latitude && userLocation.longitude
      ? [userLocation.latitude, userLocation.longitude]
      : undefined;

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

        <RoomBuilder rooms={rooms} onChange={setRooms} />
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
          maxImages={5}
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
          <PropertyMap
            selectable
            onLocationSelect={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            latitude={latitude}
            longitude={longitude}
            height="250px"
            defaultCenter={defaultCenter}
            showMyLocation={true}
            showSearch={true}
            showFallback={true}
          />
          {latitude !== undefined && longitude !== undefined ? (
            <p className="mt-2 text-xs text-green-600">
              ✓ Location set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">Click on the map to set the property location, or use "My Location".</p>
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
          {isSubmitting ? "Creating..." : "Create Listing"}
        </button>
      </div>
    </form>
  );
}