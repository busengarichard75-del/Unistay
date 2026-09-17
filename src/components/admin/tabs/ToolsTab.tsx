// src/components/admin/tabs/ToolsTab.tsx
"use client";

import {
  Settings,
  ScrollText,
  AlertTriangle,
} from "lucide-react";
import type { AuditEntry } from "@/services/auditLogService";
import type { SiteMode } from "@/services/adminActionsService";

interface ToolsTabProps {
  currentSiteMode: SiteMode;
  auditEntries: AuditEntry[];
  isFetchingAudit: boolean;
  onOpenSiteModeModal: () => void;
  onRefreshAudit: () => void;
}

export function ToolsTab({
  currentSiteMode,
  auditEntries,
  isFetchingAudit,
  onOpenSiteModeModal,
  onRefreshAudit,
}: ToolsTabProps) {
  return (
    <div className="space-y-6">
      {/* Site mode */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">
              Global Site Mode
            </h2>
          </div>
          <button
            onClick={onOpenSiteModeModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Change Mode
          </button>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            currentSiteMode === "readonly"
              ? "bg-amber-900/20 border-amber-800/50"
              : "bg-green-900/20 border-green-800/50"
          }`}
        >
          <p className="text-sm font-medium text-white">
            {currentSiteMode === "readonly"
              ? "🟡 Read-only mode active"
              : "🟢 Site online — normal operation"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {currentSiteMode === "readonly"
              ? "Students can browse but can't book. A banner shows site-wide."
              : "All functionality is available to users."}
          </p>
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScrollText size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Audit Log</h2>
            <span className="text-xs text-gray-400">
              ({auditEntries.length})
            </span>
          </div>
          <button
            onClick={onRefreshAudit}
            className="text-xs text-gray-400 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {isFetchingAudit ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-12 bg-gray-800 rounded-lg"
              />
            ))}
          </div>
        ) : auditEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No admin actions logged yet.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2">
            {auditEntries.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between rounded-lg bg-gray-800/40 border border-gray-800 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white">
                    <span className="font-medium">
                      {e.action.replace(/_/g, " ")}
                    </span>
                    {e.targetLabel && (
                      <span className="text-gray-500"> · {e.targetLabel}</span>
                    )}
                  </p>
                  {e.details && (
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {e.details}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {e.adminEmail} · {new Date(e.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-red-900/10 rounded-xl border border-red-900/50 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={20} className="text-red-400" />
          <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-200/70">
          Careful actions. These can affect many users.
        </p>
      </div>
    </div>
  );
}