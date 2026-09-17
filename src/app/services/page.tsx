"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getAllServices } from "@/services/serviceService";
import { Service, isServiceBoosted } from "@/types/service";
import { ServiceCard } from "@/components/services/ServiceCard";
import { UniversityFilter } from "@/components/shared/UniversityFilter";
import { ListingSearchBar } from "@/components/shared/ListingSearchBar";
import { Wrench } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setKeyword(q);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllServices();
        setServices(data.filter((s) => !s.adminHidden));
      } catch {
        // silent
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    const list = services.filter((s) => {
      if (universityId && s.universityId !== universityId) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });

    // Sort: boosted first, then newest
    return list.sort((a, b) => {
      const aBoost = isServiceBoosted(a) ? 1 : 0;
      const bBoost = isServiceBoosted(b) ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      if (aBoost) return (b.boostedAt || 0) - (a.boostedAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [services, keyword, universityId]);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-wide py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)]">
            🛠️ Services near you
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Trusted student services from verified providers
          </p>
        </div>

        <div className="space-y-3">
          <ListingSearchBar
            value={keyword}
            onChange={setKeyword}
            placeholder="Search services or providers..."
            storageKey="recentSearches_services"
          />

          <UniversityFilter selected={universityId} onChange={setUniversityId} />
        </div>

        <div className="mt-6">
          {isFetching ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-3 shadow-sm">
                  <div className="mb-3 aspect-[4/3] w-full rounded-xl bg-gray-200" />
                  <div className="mb-2 h-3.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                <Wrench size={28} />
              </div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                No services found
              </p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                {keyword || universityId
                  ? "Try a different search or university filter."
                  : "Service providers haven't added anything yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}