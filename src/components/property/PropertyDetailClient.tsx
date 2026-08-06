"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ArrowLeft, Bed, Home, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { getPropertyById } from "@/services/propertyService";
import { addBooking } from "@/services/bookingService";
import { BookingAuthPrompt } from "@/components/property/BookingAuthPrompt";
import { useAuth } from "@/lib/AuthContext";
import { Property } from "@/types/property";

interface PropertyDetailClientProps {
  id: string;
}

export function PropertyDetailClient({ id }: PropertyDetailClientProps) {
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBedId, setSubmittedBedId] = useState<string | null>(null);

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

      if (db) {
        const firestore = db;

        try {
          const userSnapshot = await getDoc(
            doc(firestore, "users", user.uid)
          );

          if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            studentName = data?.name || studentName;
          }
        } catch {}
      }

      await addBooking({
        studentId: user.uid,
        studentName,
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

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">

        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {property.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img
              src={property.imageUrl}
              alt={property.title}
              className="h-56 w-full object-cover"
            />
          </div>
        )}

        <div className="card-premium p-6">
          <h1 className="text-2xl font-bold">
            {property.title}
          </h1>

          <p className="mt-1 text-sm">
            {property.location}
          </p>

          <p className="mt-2 text-xl font-bold">
            K{property.price.toLocaleString()}
          </p>
        </div>

        <div className="mt-6">

          <h2 className="mb-3 text-lg font-semibold">
            Bed Spaces
          </h2>

          {bookingMessage && (
            <div className="mb-4 flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Clock size={16}/>
              {bookingMessage}
            </div>
          )}

          <div className="space-y-3">

            {property.bedSpaces.map((bed) => {
              const isAvailable = bed.isAvailable;

              const isDisabled =
                !isAvailable ||
                isSubmitting ||
                submittedBedId === bed.id;

              return (
                <div
                  key={bed.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                >

                  <div className="flex items-center gap-3">
                    <Bed size={18}/>

                    <div>
                      <p className="font-medium">
                        {getBedTypeLabel(bed)}
                      </p>

                      <span className="text-xs">
                        {isAvailable ? "Available" : "Occupied"}
                      </span>
                    </div>
                  </div>


                  <button
                    disabled={isDisabled}
                    onClick={() => handleBookClick(bed.id)}
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm text-white disabled:bg-gray-300"
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
          <Link href="/" className="inline-flex items-center gap-2">
            <Home size={16}/>
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