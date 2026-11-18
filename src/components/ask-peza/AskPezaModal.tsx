// src/components/ask-peza/AskPezaModal.tsx
"use client";

import { useState } from "react";
import { X, Sparkles, Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createAskPezaRequest } from "@/services/askPezaService";

interface AskPezaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery?: string; // Optional: if they clicked from an empty search
}

export function AskPezaModal({ isOpen, onClose, defaultQuery = "" }: AskPezaModalProps) {
  const { user } = useAuth();
  const [requestText, setRequestText] = useState(defaultQuery);
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to make a request.");
      return;
    }
    if (!requestText.trim() || !phone.trim()) {
      toast.error("Please describe what you need and provide a WhatsApp number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAskPezaRequest({
        userId: user.uid,
        userName: user.fullName || user.email || "Student",
        userPhone: phone.trim(),
        requestText: requestText.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay so the user doesn't see it flicker
    setTimeout(() => {
      setIsSuccess(false);
      setRequestText("");
    }, 300);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-8 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-6 text-center text-white">
          <button 
            onClick={handleClose} 
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Sparkles size={24} className="text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Ask Peza</h2>
          <p className="mt-1 text-xs text-white/90">
            Our concierge team will find exactly what you need.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center py-6 text-center animate-in zoom-in-95">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Request Received!</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-xs">
                Our team is on it. We will WhatsApp you at <strong>{phone}</strong> as soon as we find a match.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-black transition-transform active:scale-95"
              >
                Done
              </button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                  What are you looking for?
                </label>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  rows={3}
                  placeholder="e.g. A scientific calculator under K200, or a room near UNZA with a private bathroom..."
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                  Your WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0971234567"
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
                <p className="mt-1.5 text-[11px] text-gray-500">
                  We'll use this to send you photos and prices when we find it.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !requestText.trim() || !phone.trim()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {isSubmitting ? "Sending to Concierge..." : "Send Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}