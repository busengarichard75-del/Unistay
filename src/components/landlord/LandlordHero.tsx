// src/components/landlord/LandlordHero.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface LandlordHeroProps {
  email: string;
  totalListings?: number;
  totalAvailableBeds?: number;
  pendingRequests?: number;
  totalBookings?: number;
}

export function LandlordHero({
  email,
  totalListings = 0,
  totalAvailableBeds = 0,
  pendingRequests = 0,
  totalBookings = 0,
}: LandlordHeroProps) {
  const name = email?.split("@")[0] || "Landlord";

  return (
    <div className="space-y-4">
      {/* ─── Hero ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-[var(--nexora-navy)] to-[var(--nexora-primary)] p-6 text-center text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome back, {name} 👋</h1>
        <p className="mt-1 text-sm text-white/80">
          List your property on Peza and connect with students looking for accommodation near their campus.
        </p>
        <p className="text-sm text-white/70">
          It's completely free to list. You only pay if you choose to boost your property for extra visibility.
        </p>
        <Link
          href="/dashboard/landlord/add-listing"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-[var(--nexora-navy)] shadow-md transition-all hover:scale-105 hover:shadow-xl"
        >
          <Plus size={20} />
          Add New Listing
        </Link>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[var(--nexora-navy)]">{totalListings}</p>
          <p className="text-xs text-gray-500">Listings</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[var(--nexora-navy)]">{totalAvailableBeds}</p>
          <p className="text-xs text-gray-500">Available Beds</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[var(--nexora-warning)]">{pendingRequests}</p>
          <p className="text-xs text-gray-500">Pending Requests</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[var(--nexora-success)]">{totalBookings}</p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
      </div>
    </div>
  );
}