// src/components/admin/shared.tsx
"use client";

import { LayoutGrid, Eye } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof LayoutGrid;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors text-left w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </button>
  );
}

export function QuickAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof LayoutGrid;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg bg-gray-800/50 border border-gray-700 p-3 text-left transition-colors hover:bg-gray-800 hover:border-gray-600"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900/40 text-blue-400">
        <Icon size={14} />
      </div>
      <span className="text-xs font-medium text-gray-200 leading-tight">
        {label}
      </span>
    </button>
  );
}

export function AnalyticsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
  color: string;
}) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: "bg-amber-900/40 text-amber-300",
    approved: "bg-blue-900/40 text-blue-300",
    confirmed: "bg-green-900/40 text-green-300",
    rejected: "bg-red-900/40 text-red-300",
    expired: "bg-gray-800 text-gray-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        map[status] || map.expired
      }`}
    >
      {status}
    </span>
  );
}