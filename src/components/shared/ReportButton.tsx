// src/components/shared/ReportButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Flag, X, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  REPORT_REASONS,
  ReportReason,
  ReportTargetType,
} from "@/types/report";
import {
  submitReport,
  hasUserReportedTarget,
} from "@/services/reportService";
import { useRouter } from "next/navigation";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetOwnerId: string;
}

export function ReportButton({
  targetType,
  targetId,
  targetTitle,
  targetOwnerId,
}: ReportButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  // Check if user already reported this
  useEffect(() => {
    if (!user) return;
    let active = true;
    hasUserReportedTarget(user.uid, targetId).then((already) => {
      if (active) setHasReported(already);
    });
    return () => {
      active = false;
    };
  }, [user, targetId]);

  // Don't show report button for the owner
  if (user && user.uid === targetOwnerId) return null;

  const handleOpen = () => {
    if (!user) {
      toast.info("Please log in to report a listing.");
      router.push("/login");
      return;
    }
    if (hasReported) {
      toast.info("You've already reported this listing.");
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitReport({
        reporterId: user.uid,
        reporterEmail: user.email || "",
        targetType,
        targetId,
        targetTitle,
        targetOwnerId,
        reason,
        note: note.trim() || undefined,
      });
      toast.success("Thank you — your report has been sent to Peza.");
      setIsOpen(false);
      setHasReported(true);
      setNote("");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-red-500"
        disabled={hasReported}
        title={hasReported ? "You've already reported this" : "Report this listing"}
      >
        <Flag size={12} />
        {hasReported ? "Reported" : "Report"}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-3 py-3 sm:px-4"
          onClick={() => !isSubmitting && setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Report listing
                </h3>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {targetTitle}
                </p>
              </div>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Peza reviews every report. False or abusive reports may affect your account.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Why are you reporting this?
                </label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((r) => {
                    const active = reason === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setReason(r.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all ${
                          active
                            ? "border-[var(--nexora-primary)] bg-blue-50/60"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 text-sm text-gray-800">
                          <span>{r.icon}</span>
                          {r.label}
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                            active
                              ? "bg-[var(--nexora-primary)] text-white"
                              : "border border-gray-300"
                          }`}
                        >
                          {active && <Check size={12} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Additional details (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add any extra context that might help us review..."
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}