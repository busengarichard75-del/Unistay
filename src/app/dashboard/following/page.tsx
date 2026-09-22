// src/app/dashboard/following/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { useAuth } from "@/lib/AuthContext";
import { BackButton } from "@/components/ui/BackButton";
import {
  getFollowingProviderIds,
} from "@/services/followService";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ProductCard } from "@/components/products/ProductCard";
import type { Service } from "@/types/service";
import type { Product } from "@/types/product";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";
import { Users, Sparkles } from "lucide-react";

type FeedItem =
  | { kind: "service"; data: Service }
  | { kind: "product"; data: Product };

const MAX_ITEMS = 40;
const BATCH_SIZE = 10; // Firestore "in" query limit — safe across SDK versions

export default function FollowingFeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [followedCount, setFollowedCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);

  // ─── Guest gate: send to login ───
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const providerIds = await getFollowingProviderIds(user.uid);
        if (!active) return;
        setFollowedCount(providerIds.length);

        if (providerIds.length === 0) {
          setFeed([]);
          return;
        }

        // ── Chunk provider IDs (Firestore "in" max 10) ──
        const chunks: string[][] = [];
        for (let i = 0; i < providerIds.length; i += BATCH_SIZE) {
          chunks.push(providerIds.slice(i, i + BATCH_SIZE));
        }

        // ── Fetch services + products per chunk in parallel ──
        const [serviceSnaps, productSnaps] = await Promise.all([
          Promise.all(
            chunks.map((chunk) =>
              withRetry(
                () =>
                  getDocs(
                    query(
                      collection(db, "services"),
                      where("ownerId", "in", chunk),
                      orderBy("createdAt", "desc")
                    )
                  ),
                { shouldRetry: shouldRetryRead }
              )
            )
          ),
          Promise.all(
            chunks.map((chunk) =>
              withRetry(
                () =>
                  getDocs(
                    query(
                      collection(db, "products"),
                      where("ownerId", "in", chunk),
                      orderBy("createdAt", "desc")
                    )
                  ),
                { shouldRetry: shouldRetryRead }
              )
            )
          ),
        ]);

        if (!active) return;

        const services: FeedItem[] = serviceSnaps
          .flatMap((snap) =>
            snap.docs.map(
              (d) => ({ kind: "service" as const, data: { id: d.id, ...d.data() } as Service })
            )
          )
          .filter((x) => !x.data.adminHidden);

        const products: FeedItem[] = productSnaps
          .flatMap((snap) =>
            snap.docs.map(
              (d) => ({ kind: "product" as const, data: { id: d.id, ...d.data() } as Product })
            )
          )
          .filter((x) => !x.data.adminHidden);

        // ── Merge + sort by createdAt desc + cap ──
        const merged = [...services, ...products].sort(
          (a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0)
        );

        setFeed(merged.slice(0, MAX_ITEMS));
      } catch (err) {
        console.error("Failed to load following feed:", err);
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium flex-1 py-6">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ─── Header ─── */}
        <div className="card-premium bg-[var(--nexora-navy)] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Users size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">Following</h1>
              <p className="mt-0.5 text-xs text-gray-300">
                {followedCount > 0
                  ? `New listings from ${followedCount} provider${
                      followedCount === 1 ? "" : "s"
                    } you follow`
                  : "Follow providers to see their newest listings here"}
              </p>
            </div>
            {user.providerType && (
              <Link
                href="/dashboard/provider/followers"
                className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25 sm:inline-flex"
              >
                <Users size={13} />
                My followers
              </Link>
            )}
          </div>
        </div>

        {/* ─── Feed ─── */}
        <div className="mt-6">
          {isFetching ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] w-full bg-gray-200" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : followedCount === 0 ? (
            <EmptyState
              title="You're not following anyone yet"
              body="Follow a provider from any listing or their profile to see their new listings here."
              actionLabel="Browse services"
              actionHref="/services"
            />
          ) : feed.length === 0 ? (
            <EmptyState
              title="No new listings yet"
              body="The providers you follow haven't posted anything new. Check back soon."
              actionLabel="Browse marketplace"
              actionHref="/marketplace"
            />
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--nexora-primary)]" />
                <h2 className="text-sm font-semibold text-[var(--nexora-text-primary)]">
                  Latest from your providers
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {feed.map((item) =>
                  item.kind === "service" ? (
                    <ServiceCard key={`s_${item.data.id}`} service={item.data} />
                  ) : (
                    <ProductCard key={`p_${item.data.id}`} product={item.data} />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="card-premium p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
        <Users size={28} />
      </div>
      <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--nexora-text-secondary)]">
        {body}
      </p>
      <Link
        href={actionHref}
        className="mt-4 inline-flex items-center gap-1 rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        {actionLabel}
      </Link>
    </div>
  );
}