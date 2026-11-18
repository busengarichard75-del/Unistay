// src/components/services/BookingModal.tsx
"use client";

import { useState } from "react";
import { X, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Service } from "@/types/service";
import { User } from "@/types/user";
import { createAppointment } from "@/services/appointmentService";
import { createNotification } from "@/services/notificationService";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  user: User | null;
}

export function BookingModal({ isOpen, onClose, service, user }: BookingModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to book.");
      return;
    }
    if (!date || !time) {
      toast.error("Please select a date and time.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment({
        serviceId: service.id,
        serviceTitle: service.title,
        providerId: service.ownerId,
        studentId: user.uid,
        studentName: user.fullName || "Student",
        studentPhone: user.phone || "",
        date,
        time,
        notes: notes.trim() || undefined,
      });

      // Notify the Provider
      await createNotification(service.ownerId, {
        title: "New Service Request 🛠️",
        body: `${user.fullName || "A student"} requested a booking for ${service.title} on ${date} at ${time}.`,
        type: "announcement", // Fixed: was "appointment"
        link: "/dashboard/provider/appointments",
      });

      setIsSuccess(true);
    } catch (err) {
      toast.error("Failed to request appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setDate("");
      setTime("");
      setNotes("");
      setIsSuccess(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4" onClick={handleClose}>
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-8" onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-gradient-to-br from-[var(--nexora-navy)] to-indigo-900 px-6 py-6 text-center text-white">
          <button onClick={handleClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X size={20} />
          </button>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Calendar size={24} className="text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold">Book Service</h2>
          <p className="mt-1 text-sm text-white/80">{service.title}</p>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center py-6 text-center animate-in zoom-in-95">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Request Sent!</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-xs">
                The provider will review your request for {date} at {time}. They will contact you shortly to confirm.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-black transition-transform active:scale-95"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. I need a skin fade..."
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-800 text-center">
                Payment is made directly to the provider on arrival.
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !date || !time}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Send Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}