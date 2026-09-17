// src/components/admin/tabs/PaymentsTab.tsx
"use client";

import { Check, Search, DollarSign, CreditCard } from "lucide-react";
import type { Booking } from "@/types/booking";
import type { Property } from "@/types/property";
import { isBoosted } from "@/lib/boostService";

interface PaymentsTabProps {
  filteredBookings: Booking[];
  isFetching: boolean;
  isSubmitting: string | null;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  agentFee: number;
  boostedProperties: Property[];
  onMarkPaid: (id: string) => void;
  onRefundClick: (id: string, title: string) => void;
}

export function PaymentsTab({
  filteredBookings,
  isFetching,
  isSubmitting,
  searchTerm,
  onSearchChange,
  agentFee,
  boostedProperties,
  onMarkPaid,
  onRefundClick,
}: PaymentsTabProps) {
  return (
    <div className="space-y-6">
      {/* Pending payments */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">
              Pending Payments (K{agentFee})
            </h2>
          </div>
          <span className="text-sm text-gray-400">
            {filteredBookings.length} pending
          </span>
        </div>

        <div className="mb-4 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
          />
        </div>

        {isFetching ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-16 bg-gray-800 rounded-lg"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Check
              size={40}
              className="mx-auto text-green-500"
              strokeWidth={1.5}
            />
            <p className="text-sm text-gray-300 mt-2">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {booking.studentName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {booking.propertyTitle} • K{booking.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onMarkPaid(booking.id)}
                  disabled={isSubmitting === booking.id}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting === booking.id ? (
                    "..."
                  ) : (
                    <>
                      <Check size={16} /> Confirm
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boost refunds */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={20} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Boost Refunds</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Refund a K100 boost and remove it from a property. Send the money back
          via mobile money manually.
        </p>
        {boostedProperties.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No active boosts.
          </p>
        ) : (
          <div className="space-y-2">
            {boostedProperties.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-400">{p.location}</p>
                </div>
                <button
                  onClick={() => onRefundClick(p.id, p.title)}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                >
                  Refund K100
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}