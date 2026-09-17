// src/components/admin/tabs/DashboardTab.tsx
"use client";

import {
  LayoutGrid,
  Calendar,
  CreditCard,
  EyeOff,
  Users,
  Briefcase,
  Check,
  Star,
  Landmark,
  AlertTriangle,
  DollarSign,
  Store,
  Megaphone,
  BarChart3,
  ScrollText,
} from "lucide-react";
import {
  KpiCard,
  QuickAction,
} from "@/components/admin/shared";
import type { AdminStats, AdminTab } from "@/components/admin/types";
import type { AuditEntry } from "@/services/auditLogService";

interface DashboardTabProps {
  stats: AdminStats;
  providerPendingCount: number;
  auditEntries: AuditEntry[];
  statsReset: boolean;
  onShowStats: () => void;
  onResetStats: () => void;
  onGoToTab: (tab: AdminTab) => void;
}

export function DashboardTab({
  stats,
  providerPendingCount,
  auditEntries,
  statsReset,
  onShowStats,
  onResetStats,
  onGoToTab,
}: DashboardTabProps) {
  const formatCurrency = (n: number) => `K${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Properties"
          value={stats.totalProperties}
          icon={LayoutGrid}
          color="text-cyan-400"
          onClick={() => onGoToTab("properties")}
        />
        <KpiCard
          label="Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          color="text-purple-400"
          onClick={() => onGoToTab("bookings")}
        />
        <KpiCard
          label="Pending"
          value={stats.pendingPayments}
          icon={CreditCard}
          color="text-yellow-400"
          onClick={() => onGoToTab("payments")}
        />
        <KpiCard
          label="Hidden"
          value={stats.hiddenProperties}
          icon={EyeOff}
          color="text-red-400"
          onClick={() => onGoToTab("properties")}
        />
        <KpiCard
          label="Students"
          value={stats.totalStudents}
          icon={Users}
          color="text-green-400"
          onClick={() => onGoToTab("users")}
        />
        <KpiCard
          label="Landlords"
          value={stats.totalLandlords}
          icon={Briefcase}
          color="text-orange-400"
          onClick={() => onGoToTab("users")}
        />
        <KpiCard
          label="Confirmed"
          value={stats.completedBookings}
          icon={Check}
          color="text-emerald-400"
          onClick={() => onGoToTab("bookings")}
        />
        <KpiCard
          label="Boosted"
          value={stats.boostedListings}
          icon={Star}
          color="text-yellow-400"
          onClick={() => onGoToTab("properties")}
        />
      </div>

      {/* Revenue tracker */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Landmark size={22} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Revenue Tracker
            </h3>
          </div>
          {statsReset ? (
            <button
              onClick={onShowStats}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              Show Stats
            </button>
          ) : (
            <button
              onClick={onResetStats}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Reset
            </button>
          )}
        </div>

        {statsReset ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
            <p className="text-sm">Stats hidden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-sm text-gray-400">Agent Fees</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(stats.agentFeeRevenue)}
              </p>
              <p className="text-xs text-gray-500">
                {stats.completedBookings} × K100
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-sm text-gray-400">Boost Revenue</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(stats.boostRevenue)}
              </p>
              <p className="text-xs text-gray-500">
                {stats.boostedListings} × K100
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 rounded-lg p-4 border border-blue-700/50">
              <p className="text-sm text-gray-300">Total</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            label={`Payments (${stats.pendingPayments})`}
            icon={DollarSign}
            onClick={() => onGoToTab("payments")}
          />
          <QuickAction
            label={`Shop (${providerPendingCount})`}
            icon={Store}
            onClick={() => onGoToTab("shop")}
          />
          <QuickAction
            label="Announce"
            icon={Megaphone}
            onClick={() => onGoToTab("comms")}
          />
          <QuickAction
            label="Analytics"
            icon={BarChart3}
            onClick={() => onGoToTab("analytics")}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ScrollText size={16} className="text-blue-400" /> Recent admin
            activity
          </h3>
          <button
            onClick={() => onGoToTab("tools")}
            className="text-xs text-gray-400 hover:text-white"
          >
            View all →
          </button>
        </div>
        {auditEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No activity yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {auditEntries.slice(0, 5).map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/40 p-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs text-gray-200 truncate">
                    <span className="font-medium">
                      {e.action.replace(/_/g, " ")}
                    </span>
                    {e.targetLabel && (
                      <span className="text-gray-500"> · {e.targetLabel}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}