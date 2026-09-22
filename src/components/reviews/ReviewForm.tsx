// src/components/reviews/ReviewForm.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { StarRating } from "./StarRating";
import { createOrUpdateReview } from "@/services/reviewService";
import type { Review, ReviewTargetKind } from "@/types/review";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReviewTargetKind;
  targetId: string;
  targetOwnerId: string;
  targetTitle: string;
  /** When present, we're editing — prefill and switch button label. */
  existingReview?: Review | null;
  /** Called after a successful save so the parent can refresh. */
  onSaved?: () => void;
}

export function ReviewForm({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetOwnerId,
  targetTitle,
  existingReview,
  onSaved,
}: ReviewFormProps) {
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Prefill when opening (edit mode) or reset (new mode) ───
  useEffect(() => {
    if (!isOpen) return;
    if (existingReview) {
      setRating(existingReview.rating);
      setText(existingReview.text ?? "");
    } else {
      setRating(0);
      setText("");
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const isEditing = !!existingReview;
  const canSubmit = rating >= 1 && !submitting;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to review.");
      return;
    }
    if (rating < 1) {
      toast.error("Please choose a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      await createOrUpdateReview({
        authorId: user.uid,
        authorName: user.businessName || user.fullName || undefined,
        authorPhotoURL: user.photoURL || undefined,
        targetType,
        targetId,
        targetOwnerId,
        rating,
        text: text.trim() || undefined,
      });
      toast.success(isEditing ? "Review updated." : "Thanks for your review!");
      onSaved?.();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save review.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-3 py-3 sm:px-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isEditing ? "Edit your review" : "Write a review"}
            </h3>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {targetTitle}
            </p>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Star input */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">
              Your rating
            </label>
            <div className="flex items-center gap-3">
              <StarRating
                value={rating}
                interactive
                size="lg"
                onChange={setRating}
              />
              {rating > 0 && (
                <span className="text-sm font-semibold text-gray-700">
                  {rating}.0
                </span>
              )}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Share details (optional)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="What was your experience? Quality, turnaround, communication…"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
            />
            <p className="mt-1 text-right text-[10px] text-gray-400">
              {text.length}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting
                ? "Saving…"
                : isEditing
                ? "Save changes"
                : "Post review"}
            </button>
          </div>

          {!isEditing && (
            <p className="text-center text-[10px] text-gray-400">
              Only users who contacted this provider via WhatsApp can review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}