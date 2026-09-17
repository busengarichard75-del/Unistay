// src/components/admin/tabs/BookingsTab.tsx
"use client";

import { Calendar } from "lucide-react";
import type { Booking } from "@/types/booking";
import { BookingStatusPill } from "@/components/admin/shared";

interface BookingsTabProps {
  allBookings: Booking[];
  onCancelClick: (booking: Booking) => void;
}

export function BookingsTab({ allBookings, onCancelClick }: BookingsTabProps) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-orange-400" />
          <h2 className="text-lg font-semibold text-white">All Bookings</h2>
          <span className="text-xs text-gray-400">({allBookings.length})</span>
        </div>
      </div>

      {allBookings.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No bookings yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
          {allBookings.map((b) => (
            <div
              key={b.id}
              className="rounded-lg bg-gray-800/50 border border-gray-700 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {b.propertyTitle}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.studentName} · K{b.price.toLocaleString()}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <BookingStatusPill status={b.status} />
                    <span className="text-[10px] text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {b.status !== "confirmed" &&
                  b.status !== "rejected" &&
                  b.status !== "expired" && (
                    <button
                      onClick={() => onCancelClick(b)}
                      className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}