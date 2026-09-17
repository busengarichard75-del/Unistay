// src/components/admin/tabs/PropertiesTab.tsx
"use client";

import { Search, Home, Building, Star } from "lucide-react";
import type { Property } from "@/types/property";
import { isBoosted, getBoostDaysRemaining } from "@/lib/boostService";

interface PropertiesTabProps {
  allProperties: Property[];
  pendingProperties: Property[];
  isFetchingProperties: boolean;
  statsHiddenProperties: number;
  propertyFilter: "all" | "pending" | "hidden";
  onPropertyFilterChange: (f: "all" | "pending" | "hidden") => void;
  boostSearchTerm: string;
  onBoostSearchTermChange: (v: string) => void;
  selectedPropertyIds: string[];
  onToggleSelectProp: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isVerifying: string | null;
  isTogglingBoost: string | null;
  onVerifyProperty: (property: Property, status: "approved" | "rejected") => void;
  onToggleBoost: (property: Property) => void;
  onHideClick: (property: Property) => void;
  onUnhide: (property: Property) => void;
  onBulkModal: (status: "approved" | "rejected") => void;
}

export function PropertiesTab({
  allProperties,
  pendingProperties,
  isFetchingProperties,
  statsHiddenProperties,
  propertyFilter,
  onPropertyFilterChange,
  boostSearchTerm,
  onBoostSearchTermChange,
  selectedPropertyIds,
  onToggleSelectProp,
  onSelectAll,
  onDeselectAll,
  isVerifying,
  isTogglingBoost,
  onVerifyProperty,
  onToggleBoost,
  onHideClick,
  onUnhide,
  onBulkModal,
}: PropertiesTabProps) {
  // Filter properties for the "All / Hidden" list
  const filteredForList = allProperties.filter((p) => {
    const s = boostSearchTerm.toLowerCase();
    const matchesSearch =
      !s || p.title.toLowerCase().includes(s) || p.location.toLowerCase().includes(s);
    if (!matchesSearch) return false;
    if (propertyFilter === "hidden") return p.adminHidden === true;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter chips */}
      <div className="flex gap-2">
        {(["all", "pending", "hidden"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onPropertyFilterChange(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              propertyFilter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f === "all"
              ? `All (${allProperties.length})`
              : f === "pending"
              ? `Pending (${pendingProperties.length})`
              : `Hidden (${statsHiddenProperties})`}
          </button>
        ))}
      </div>

      {/* Pending verifications */}
      {(propertyFilter === "pending" || propertyFilter === "all") &&
        pendingProperties.length > 0 && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building size={20} className="text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  Pending Verifications
                </h2>
                <span className="text-xs text-gray-400">
                  ({pendingProperties.length})
                </span>
              </div>
              {selectedPropertyIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {selectedPropertyIds.length} selected
                  </span>
                  <button
                    onClick={() => onBulkModal("rejected")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Reject all
                  </button>
                  <button
                    onClick={() => onBulkModal("approved")}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Approve all
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {pendingProperties.map((property) => {
                const selected = selectedPropertyIds.includes(property.id);
                return (
                  <div
                    key={property.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selected
                        ? "bg-blue-900/20 border-blue-700"
                        : "bg-gray-800/50 border-yellow-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelectProp(property.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {property.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {property.location}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Owner: {property.ownerId} · K{property.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onVerifyProperty(property, "rejected")}
                        disabled={isVerifying === property.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onVerifyProperty(property, "approved")}
                        disabled={isVerifying === property.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={
                  selectedPropertyIds.length === pendingProperties.length
                    ? onDeselectAll
                    : onSelectAll
                }
                className="text-xs text-gray-400 hover:text-white"
              >
                {selectedPropertyIds.length === pendingProperties.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>
          </div>
        )}

      {/* All properties */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Home size={20} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">
            {propertyFilter === "hidden" ? "Hidden Properties" : "All Properties"}
          </h2>
        </div>

        <div className="mb-4 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={boostSearchTerm}
            onChange={(e) => onBoostSearchTermChange(e.target.value)}
            placeholder="Search properties..."
            className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
          />
        </div>

        {isFetchingProperties ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-12 bg-gray-800 rounded-lg"
              />
            ))}
          </div>
        ) : filteredForList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No properties found.
          </p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredForList.map((property) => {
              const boosted = isBoosted(property);
              const daysLeft = boosted ? getBoostDaysRemaining(property) : 0;
              const hidden = property.adminHidden === true;
              return (
                <div
                  key={property.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    hidden
                      ? "bg-red-900/10 border-red-900/50"
                      : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {property.title}
                        {hidden && (
                          <span className="ml-2 text-[10px] font-semibold text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full">
                            HIDDEN
                          </span>
                        )}
                        {boosted && (
                          <span className="ml-2 text-[10px] text-yellow-400 inline-flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> {daysLeft}d
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {property.location} · K
                        {property.price.toLocaleString()}
                      </p>
                      {hidden && property.adminHiddenReason && (
                        <p className="text-[10px] text-red-400 mt-1">
                          Reason: {property.adminHiddenReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleBoost(property)}
                        disabled={isTogglingBoost === property.id}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          boosted
                            ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {isTogglingBoost === property.id
                          ? "..."
                          : boosted
                          ? "Unboost"
                          : "Boost"}
                      </button>
                      {hidden ? (
                        <button
                          onClick={() => onUnhide(property)}
                          className="rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-green-700"
                        >
                          Unhide
                        </button>
                      ) : (
                        <button
                          onClick={() => onHideClick(property)}
                          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}