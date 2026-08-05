"use client";

import { useState, useEffect, use } from "react";
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

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = use(params);
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
        <div className="mt-8">
          <div className="mb-3 h-6 w-1/4 rounded bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-4">
                <div className="mb-1 h-4 w-1/4 rounded bg-gray-200" />
                <div className="h-3 w-1/6 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto container-medium py-10">
        <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>
      </main>
    );
  }

  if (!property) return notFound();

  async function handleBookClick(bedSpaceId: string) {
    if (!user || !property) {
      setShowAuthPrompt(true);
      return;
    }

    // Prevent double submission
    if (isSubmitting) return;

    setSubmittedBedId(bedSpaceId);
    setIsSubmitting(true);

    try {
      let studentName = user.email || "Unknown student";
      try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          studentName = data?.name || studentName;
        }
      } catch {}

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
      // Reset submittedBedId after a short delay so the button doesn't stay disabled
      setTimeout(() => setSubmittedBedId(null), 3000);
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
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)] transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {property.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img src={property.imageUrl} alt={property.title} className="h-56 w-full object-cover" />
          </div>
        )}

        <div className="card-premium p-6">
          <h1 className="text-2xl font-bold text-[var(--nexora-text-primary)]">{property.title}</h1>
          <p className="mt-1 text-sm text-[var(--nexora-text-secondary)]">{property.location}</p>
          <p className="mt-2 text-xl font-bold text-[var(--nexora-text-primary)]">
            K{property.price.toLocaleString()}
            <span className="text-sm font-normal text-[var(--nexora-text-secondary)]">
              {property.paymentPeriod === "termly" ? " / term" : " / month"}
            </span>
          </p>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">Bed Spaces</h2>

          {bookingMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Clock size={16} className="shrink-0 mt-0.5" />
              <span>{bookingMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {property.bedSpaces.map((bed, index) => {
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
                      <p className="text-sm font-medium text-gray-900">{getBedTypeLabel(bed)}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isAvailable ? "Available" : "Occupied"}
                        </span>
                        {isAvailable && (
                          <span className="text-xs text-gray-400">· Pending approval</span>
                        )}
                      </div>
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
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            <Home size={16} />
            Browse more properties
          </Link>
        </div>
      </div>
      {showAuthPrompt && <BookingAuthPrompt onClose={() => setShowAuthPrompt(false)} />}
    </main>
  );
}