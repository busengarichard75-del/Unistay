// src/app/dashboard/provider/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { BackButton } from "@/components/ui/BackButton";
import { getProviderAppointments, updateAppointmentStatus } from "@/services/appointmentService";
import { createNotification } from "@/services/notificationService";
import { Appointment } from "@/types/appointment";
import { toast } from "sonner";
import { 
  CalendarDays, Clock, CheckCircle2, XCircle, MessageCircle, 
  RefreshCw, AlertCircle, Check 
} from "lucide-react";

type Tab = "pending" | "confirmed" | "history";

export default function ProviderAppointmentsPage() {
  const { user, isLoading } = useRequireAuth("service_provider");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!user) return;
    setIsFetching(true);
    try {
      const data = await getProviderAppointments(user.uid);
      setAppointments(data);
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const handleUpdateStatus = async (apt: Appointment, status: "confirmed" | "cancelled" | "completed") => {
    setBusyId(apt.id);
    try {
      await updateAppointmentStatus(apt.id, status);
      setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, status } : a));
      
      // Notify the Student
      if (status === "confirmed") {
        await createNotification(apt.studentId, {
          title: "Appointment Confirmed ✅",
          body: `Your appointment with ${apt.serviceTitle} for ${apt.date} at ${apt.time} has been confirmed.`,
          type: "announcement", // Fixed: was "appointment"
          link: "/dashboard/student",
        });
      } else if (status === "cancelled") {
        await createNotification(apt.studentId, {
          title: "Appointment Cancelled ❌",
          body: `Your appointment for ${apt.serviceTitle} on ${apt.date} was cancelled by the provider.`,
          type: "announcement", // Fixed: was "appointment"
          link: "/dashboard/student",
        });
      }

      toast.success(`Appointment ${status}.`);
    } catch {
      toast.error("Failed to update appointment.");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading || !user) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]"><p className="text-sm text-gray-500">Loading...</p></main>;
  }

  const filtered = appointments.filter((a) => {
    if (activeTab === "pending") return a.status === "pending";
    if (activeTab === "confirmed") return a.status === "confirmed";
    return a.status === "completed" || a.status === "cancelled";
  });

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <button onClick={loadAppointments} disabled={isFetching} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600">
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500">Manage your service bookings.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl bg-gray-900/5 p-1">
          <button onClick={() => setActiveTab("pending")} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Pending
            {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
          <button onClick={() => setActiveTab("confirmed")} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${activeTab === "confirmed" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Confirmed
            {confirmedCount > 0 && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{confirmedCount}</span>}
          </button>
          <button onClick={() => setActiveTab("history")} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${activeTab === "history" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            History
          </button>
        </div>

        {isFetching ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-gray-300 bg-white">
            <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No {activeTab} appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((apt) => (
              <div key={apt.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{apt.serviceTitle}</h3>
                    <p className="mt-1 text-xs text-gray-500">Requested by: <strong className="text-gray-800">{apt.studentName}</strong></p>
                    {apt.notes && <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">Note: {apt.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-indigo-600">
                      <CalendarDays size={14} /> {apt.date}
                    </p>
                    <p className="flex items-center justify-end gap-1.5 text-xs text-gray-500 mt-1">
                      <Clock size={14} /> {apt.time}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
                  {apt.status === "pending" ? (
                    <>
                      <button onClick={() => handleUpdateStatus(apt, "cancelled")} disabled={busyId === apt.id} className="flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                        <XCircle size={14} /> Decline
                      </button>
                      <button onClick={() => handleUpdateStatus(apt, "confirmed")} disabled={busyId === apt.id} className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                        <Check size={14} /> Accept
                      </button>
                    </>
                  ) : apt.status === "confirmed" ? (
                    <>
                      <a href={`https://wa.me/${apt.studentPhone.replace(/\D/g, "")}?text=Hi ${apt.studentName}, confirming our appointment on Peza for ${apt.date} at ${apt.time}.`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white hover:opacity-90">
                        <MessageCircle size={14} /> WhatsApp {apt.studentPhone}
                      </a>
                      <button onClick={() => handleUpdateStatus(apt, "completed")} disabled={busyId === apt.id} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    </>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${apt.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {apt.status === "completed" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {apt.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}