// src/components/reviews/ReviewSection.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { ReviewCard } from "./ReviewCard";
import {
  getReviewsForListing,
  getRatingBreakdown,
  getUserReview,
  hasClickedWhatsApp,
} from "@/services/reviewService";
import type {
  Review,
  ReviewTargetKind,
  RatingBreakdown,
} from "@/types/review";

interface ReviewSectionProps {
  targetType: ReviewTargetKind;
  targetId: string;
  targetOwnerId: string;
  targetTitle: string;
}

export function ReviewSection({
  targetType,
  targetId,
  targetOwnerId,
  targetTitle,
}: ReviewSectionProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [breakdown, setBreakdown] = useState<RatingBreakdown>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
  });
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // ⚡ Dep on user?.uid (stable string) — NOT `user` (new object each render)
  const uid = user?.uid;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, bd] = await Promise.all([
        getReviewsForListing(targetId),
        getRatingBreakdown(targetId),
      ]);
      setReviews(list);
      setBreakdown(bd);

      if (uid) {
        const [mine, clicked] = await Promise.all([
          getUserReview(uid, targetId),
          hasClickedWhatsApp(uid, targetId),
        ]);
        setMyReview(mine);
        setCanReview(clicked && uid !== targetOwnerId);
      } else {
        setMyReview(null);
        setCanReview(false);
      }
    } finally {
      setLoading(false);
    }
  }, [targetId, uid, targetOwnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const count = reviews.length;
  const avg =
    count > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / count
      : 0;
  const roundedAvg = Math.round(avg * 10) / 10;

  const isOwner = uid === targetOwnerId;
  const showWriteButton = !!uid && !isOwner;

  const buttonLabel = myReview ? "Edit your review" : "Write a review";
  const buttonIcon = myReview ? Pencil : MessageSquarePlus;

  return (
    <section className="card-premium mt-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--nexora-navy)]">
            Reviews{count > 0 ? ` (${count})` : ""}
          </h2>
          {count > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating value={roundedAvg} size="sm" />
              <span className="text-xs font-semibold text-gray-700">
                {roundedAvg.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                · {count} review{count === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {showWriteButton && canReview && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95"
          >
            {(() => {
              const Icon = buttonIcon;
              return <Icon size={13} />;
            })()}
            {buttonLabel}
          </button>
        )}
      </div>

      {showWriteButton && !canReview && !myReview && (
        <p className="mt-2 rounded-lg bg-blue-50/60 px-3 py-2 text-[11px] text-blue-700">
          💬 Only users who contacted this provider via WhatsApp can leave a review.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : count === 0 ? (
        <div className="mt-3 rounded-xl bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-gray-600">
            No reviews yet
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Be the first to share your experience.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const starCount = breakdown[star as 1 | 2 | 3 | 4 | 5] ?? 0;
              const pct = count > 0 ? (starCount / count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-[10px] font-medium text-gray-500">
                    {star}★
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[10px] text-gray-400">
                    {starCount}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                targetType={targetType}
                targetOwnerId={targetOwnerId}
                onChanged={load}
                onEdit={() => setFormOpen(true)}
              />
            ))}
          </div>
        </>
      )}

      <ReviewForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetOwnerId={targetOwnerId}
        targetTitle={targetTitle}
        existingReview={myReview}
        onSaved={load}
      />
    </section>
  );
}