"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ArrowLeft, Bed, Home, Clock, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { getPropertyById } from "@/services/propertyService";
import { getBookingsByStudent } from "@/services/bookingService";
import { addBooking } from "@/services/bookingService";
import { BookingAuthPrompt } from "@/components/property/BookingAuthPrompt";
import { useAuth } from "@/lib/AuthContext";
import { Property } from "@/types/property";
import { Booking } from "@/types/booking";
import { PropertyMap } from "@/components/map/PropertyMap";
import { useGeolocation } from "@/hooks/useGeolocation";

interface PropertyDetailClientProps {
  id: string;
}

export function PropertyDetailClient({ id }: PropertyDetailClientProps) {
  const { user } = useAuth();
  const userLocation = useGeolocation();

  const [property, setProperty] = useState<Property | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBedId, setSubmittedBedId] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(id);
        setProperty(data);
      } catch {
        setError("Failed to load property details. Please try again.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      try {
        const bookings = await getBookingsByStudent(user.uid);
        setUserBookings(bookings);
      } catch {
        // Silent fail
      }
    };
    fetchBookings();
  }, [user]);

  if (isFetching) {
    return (
      <main className="mx-auto container-medium py-10">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-6 w-1/3 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto container-medium py-10">
        <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      </main>
    );
  }

  if (!property) return notFound();

  async function handleBookClick(bedSpaceId: string) {
    if (!user || !property) {
      setShowAuthPrompt(true);
      return;
    }

    if (isSubmitting) return;

    setSubmittedBedId(bedSpaceId);
    setIsSubmitting(true);

    try {
      let studentName = user.email || "Unknown student";
      let studentNumber = ""; // ✅ NEW

      if (db) {
        try {
          const userSnapshot = await getDoc(doc(db, "users", user.uid));
          if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            studentName = data?.name || studentName;
            studentNumber = data?.studentNumber || ""; // ✅ NEW
          }
        } catch {}
      }

      await addBooking({
        studentId: user.uid,
        studentName,
        studentNumber, // ✅ NEW: save student number
        landlordId: property.ownerId,
        propertyId: property.id,
        bedSpaceId,
        propertyTitle: property.title,
        price: property.price,
        paymentPeriod: property.paymentPeriod,
        status: "requested",
        createdAt: Date.now(),
      });

      setBookingMessage(
        "Request sent! The landlord will review and approve your booking. The bed remains available until approved."
      );

      toast.success("Booking request sent successfully!");

    } catch {
      toast.error("Failed to send booking request. Please try again.");

    } finally {
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmittedBedId(null);
      }, 3000);
    }
  }

  function getBedTypeLabel(bed: any): string {
    if (bed.type === "Top") return "Top Bunk";
    if (bed.type === "Bottom") return "Bottom Bunk";
    return "Standard Bed";
  }

  const images = property.imageUrls?.length
    ? property.imageUrls
    : property.imageUrl
    ? [property.imageUrl]
    : [];

  const hasCoordinates = property.latitude !== undefined && property.longitude !== undefined;

  const isLandlord = user && property.ownerId === user.uid;
  const isAdmin = user?.email && ['admin@unistay.com', 'richard@unistay.com'].includes(user.email);
  const hasConfirmedBooking = userBookings.some(
    (booking) => booking.propertyId === property.id && booking.status === "confirmed"
  );

  const showMap = hasCoordinates && (isLandlord || isAdmin || hasConfirmedBooking);

  const defaultCenter: [number, number] = userLocation.latitude && userLocation.longitude
    ? [userLocation.latitude, userLocation.longitude]
    : hasCoordinates
    ? [property.latitude!, property.longitude!]
    : [-15.3875, 28.3228];

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">

        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)] transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {images.length > 0 && (
          <div className="mb-6">
            {images.length === 1 ? (
              <div className="overflow-hidden rounded-xl">
                <img
                  src={images[0]}
                  alt={property.title}
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : (
              <div className={`grid gap-2 ${images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {images.map((url, index) => (
                  <div key={index} className="relative overflow-hidden rounded-xl">
                    <img
                      src={url}
                      alt={`${property.title} - ${index + 1}`}
                      className="h-40 w-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                        Main
                      </span>
                    )}
                    {index === images.length - 1 && images.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                        +{images.length - 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card-premium p-6">
          <h1 className="text-2xl font-bold text-[var(--nexora-text-primary)]">
            {property.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--nexora-text-secondary)]">
            {property.location}
          </p>
          <p className="mt-2 text-xl font-bold text-[var(--nexora-text-primary)]">
            K{property.price.toLocaleString()}
            <span className="text-sm font-normal text-[var(--nexora-text-secondary)]">
              {property.paymentPeriod === "termly" ? " / term" : " / month"}
            </span>
          </p>
        </div>

        {showMap ? (
          <div className="mt-6 card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--nexora-text-primary)] flex items-center gap-2">
                <MapPin size={16} className="text-[var(--nexora-primary)]" />
                Property Location
              </h3>
              <a
                href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--nexora-primary)] hover:underline flex items-center gap-1"
              >
                Open Directions
                <span className="text-xs">↗</span>
              </a>
            </div>
            <PropertyMap
              latitude={property.latitude}
              longitude={property.longitude}
              height="200px"
              selectable={false}
              defaultCenter={defaultCenter}
            />
            <p className="mt-2 text-xs text-gray-400">
              📍 {property.latitude?.toFixed(6)}, {property.longitude?.toFixed(6)}
            </p>
          </div>
        ) : (
          hasCoordinates && (
            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 border border-gray-200">
              <MapPin size={16} className="inline mr-2 text-gray-400" />
              Exact location will be available after your booking is confirmed.
            </div>
          )
        )}

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
            Bed Spaces
          </h2>

          {bookingMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Clock size={16} className="shrink-0 mt-0.5" />
              <span>{bookingMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {property.bedSpaces.map((bed) => {
              const isAvailable = bed.isAvailable;
              const isDisabled = !isAvailable || isSubmitting || submittedBedId === bed.id;

              return (
                <div
                  key={bed.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--nexora-primary-light)] text-[var(--nexora-navy)]">
                      <Bed size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getBedTypeLabel(bed)}
                      </p>
                      <span className={`text-xs ${isAvailable ? "text-green-600" : "text-red-500"}`}>
                        {isAvailable ? "Available" : "Occupied"}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isDisabled}
                    onClick={() => handleBookClick(bed.id)}
                    className={`rounded-full px-5 py-2 text-sm font-medium text-white transition-all ${
                      isAvailable && !isDisabled
                        ? "bg-[var(--nexora-primary)] hover:bg-[var(--nexora-primary-hover)] hover:shadow-md"
                        : "cursor-not-allowed bg-gray-300"
                    }`}
                  >
                    {submittedBedId === bed.id
                      ? "Sending..."
                      : isSubmitting
                      ? "Processing..."
                      : isAvailable
                      ? "Request Bed"
                      : "Unavailable"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexora-primary)] hover:underline">
            <Home size={16} />
            Browse more properties
          </Link>
        </div>

      </div>

      {showAuthPrompt && (
        <BookingAuthPrompt
          onClose={() => setShowAuthPrompt(false)}
        />
      )}
    </main>
  );
}