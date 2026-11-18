// src/components/admin/tabs/AppointmentsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, RefreshCw, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Appointment } from "@/types/appointment";
import { getAllAppointments, updateAppointmentStatus } from "@/services/appointmentService";

export function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsFetching(true);
    try {
      const data = await getAllAppointments();
      setAppointments(data);
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (apt: Appointment) => {
    if (!window.confirm(`Cancel appointment for ${apt.studentName}?`)) return;
    setBusyId(apt.id);
    try {
      await updateAppointmentStatus(apt.id, "cancelled");
      setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled.");
    } catch {
      toast.error("Failed to cancel appointment.");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDays className="text-blue-400" size={20} />
            Service Appointments
          </h2>
          <p className="text-xs text-gray-400 mt-1">Monitor all bookings across the platform.</p>
        </div>
        <button onClick={loadAppointments} disabled={isFetching} className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-50">
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-400">Pending</p>
          <p className="mt-1 text-2xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/10 p-4">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-white">{confirmedCount}</p>
        </div>
      </div>

      {isFetching ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-800" />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
          <AlertTriangle size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">No appointments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{apt.serviceTitle}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    apt.status === "confirmed" ? "bg-emerald-900/40 text-emerald-400" :
                    apt.status === "pending" ? "bg-amber-900/40 text-amber-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{apt.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Student: <strong className="text-gray-300">{apt.studentName}</strong> ({apt.studentPhone})
                </p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><CalendarDays size={10} /> {apt.date}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {apt.time}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {apt.status === "pending" || apt.status === "confirmed" ? (
                  <button onClick={() => handleCancel(apt)} disabled={busyId === apt.id} className="inline-flex items-center gap-1.5 rounded-lg border border-red-900 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50">
                    <XCircle size={12} /> Cancel
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <CheckCircle2 size={12} /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}