"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import PropertyGrid from "@/components/property/PropertyGrid";
import { getAllProperties } from "@/services/propertyService";
import { Property } from "@/types/property";
import { getUniversityFullName } from "@/lib/universityLabels";
import { ArrowLeft, Home, Loader2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ university: string }>;
}

export default function CampusHousingPage({ params }: PageProps) {
  const { university } = use(params);
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const uniName = getUniversityFullName(university) || university.toUpperCase();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const all = await getAllProperties();
        if (!active) return;
        
        // Filter only properties for this specific university
        const filtered = all.filter(
          (p) => p.universityId === university && !p.adminHidden && p.isActive !== false
        );
        
        setProperties(filtered);
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [university]);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-wide py-8 flex-1">
        <button
          onClick={() => router.push("/")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        {/* Hero Section */}
        <div className="rounded-3xl bg-[var(--nexora-navy)] px-6 py-12 text-center text-white shadow-xl sm:px-12 sm:py-16 mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[var(--nexora-primary)]/20 blur-3xl" />
          
          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <Home size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Accommodation near {uniName}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
              Find verified rooms, hostels, and bed spaces right by your campus. 
              Contact landlords directly — no hidden agent fees.
            </p>
          </div>
        </div>

        {/* Listings */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--nexora-navy)]">
              Available Properties
              {!isFetching && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({properties.length})
                </span>
              )}
            </h2>
            <Link 
              href="/" 
              className="text-sm font-semibold text-[var(--nexora-primary)] hover:underline"
            >
              View all campuses
            </Link>
          </div>

          {isFetching ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
          ) : properties.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Home size={28} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                No listings yet for {uniName}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to list a property near this campus, or check back later.
              </p>
              <Link
                href="/dashboard/landlord/add-listing"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
              >
                List a Property
              </Link>
            </div>
          ) : (
            <PropertyGrid properties={properties} />
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}