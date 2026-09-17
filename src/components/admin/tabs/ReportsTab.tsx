// src/components/admin/tabs/ReportsTab.tsx
"use client";

import { Flag, Check, X, Eye, AlertTriangle } from "lucide-react";
import type { Report } from "@/types/report";
import { REPORT_REASON_LABELS } from "@/types/report";

interface ReportsTabProps {
  reports: Report[];
  isFetchingReports: boolean;
  busyReportId: string | null;
  onTakeDown: (report: Report) => void;
  onDismiss: (report: Report) => void;
}

export function ReportsTab({
  reports,
  isFetchingReports,
  busyReportId,
  onTakeDown,
  onDismiss,
}: ReportsTabProps) {
  const pending = reports.filter((r) => r.status === "pending");
  const resolved = reports.filter((r) => r.status === "resolved");
  const dismissed = reports.filter((r) => r.status === "dismissed");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Pending</span>
            <Flag size={14} className="text-amber-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-green-800/50 bg-green-900/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Resolved</span>
            <Check size={14} className="text-green-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{resolved.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Dismissed</span>
            <X size={14} className="text-gray-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{dismissed.length}</p>
        </div>
      </div>

      {/* Pending reports */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flag size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Pending Reports
          </h3>
          <span className="text-xs text-gray-400">({pending.length})</span>
        </div>

        {isFetchingReports ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-24 rounded-xl bg-gray-800"
              />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
            <Flag size={28} className="mx-auto text-gray-700" />
            <p className="mt-2 text-sm text-gray-500">No pending reports.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => {
              const busy = busyReportId === r.id;
              const isService = r.targetType === "service";

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/40 text-amber-400">
                      <AlertTriangle size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {r.targetTitle}
                        </p>
                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                          {isService ? "Service" : "Product"}
                        </span>
                        <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] font-medium text-red-300">
                          {REPORT_REASON_LABELS[r.reason]}
                        </span>
                      </div>

                      {r.note && (
                        <p className="mt-1.5 text-xs italic text-gray-400 break-words">
                          "{r.note}"
                        </p>
                      )}

                      <p className="mt-1.5 text-[10px] text-gray-500">
                        Reported by {r.reporterEmail} ·{" "}
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 border-t border-amber-800/30 pt-3">
                    <a
                      href={
                        isService
                          ? `/services/${r.targetId}`
                          : `/marketplace/${r.targetId}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
                    >
                      <Eye size={12} />
                      View
                    </a>
                    <div className="flex-1" />
                    <button
                      onClick={() => onDismiss(r)}
                      disabled={busy}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
                    >
                      {busy ? "..." : "Dismiss"}
                    </button>
                    <button
                      onClick={() => onTakeDown(r)}
                      disabled={busy}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? "..." : "Take Down"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-2">
            {resolved.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-900/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white">{r.targetTitle}</p>
                  <p className="text-[10px] text-gray-500">
                    {REPORT_REASON_LABELS[r.reason]} ·{" "}
                    {r.reviewedAt
                      ? new Date(r.reviewedAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-900/40 px-2 py-0.5 text-[10px] font-medium text-green-300">
                  Resolved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dismissed */}
      {dismissed.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            Dismissed ({dismissed.length})
          </h3>
          <div className="space-y-2">
            {dismissed.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-900/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-400">
                    {r.targetTitle}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {REPORT_REASON_LABELS[r.reason]}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                  Dismissed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}