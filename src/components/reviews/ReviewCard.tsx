// src/components/reviews/ReviewCard.tsx
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, MessageCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { StarRating } from "./StarRating";
import { ReportButton } from "@/components/shared/ReportButton";
import { deleteReview, addReply, deleteReply } from "@/services/reviewService";
import type { Review, ReviewTargetKind } from "@/types/review";

interface ReviewCardProps {
  review: Review;
  targetType: ReviewTargetKind;
  targetOwnerId: string;
  onChanged?: () => void;
  onEdit?: (review: Review) => void;
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ReviewCard({
  review,
  targetType,
  targetOwnerId,
  onChanged,
  onEdit,
}: ReviewCardProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.reply?.text ?? "");
  const [replyBusy, setReplyBusy] = useState(false);

  const isAuthor = user?.uid === review.authorId;
  const isOwner = user?.uid === targetOwnerId;
  const canReply = isOwner; // only the listing owner replies
  const canReport = !!user && !isAuthor && !isOwner;

  const authorDisplay = review.authorName || "Peza user";
  const timeAgo = review.createdAt
    ? formatDistanceToNow(review.createdAt, { addSuffix: true })
    : "";

  // ─── Delete own review ───
  const handleDelete = async () => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    setBusy(true);
    try {
      await deleteReview(review.id);
      toast.success("Review deleted.");
      onChanged?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete review.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // ─── Submit owner reply ───
  const handleReplySubmit = async () => {
    const clean = replyText.trim();
    if (!clean) {
      toast.error("Reply cannot be empty.");
      return;
    }
    setReplyBusy(true);
    try {
      await addReply(review.id, clean);
      toast.success("Reply posted.");
      setReplyOpen(false);
      onChanged?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to post reply.";
      toast.error(msg);
    } finally {
      setReplyBusy(false);
    }
  };

  // ─── Delete owner reply ───
  const handleReplyDelete = async () => {
    if (!window.confirm("Remove your reply?")) return;
    setReplyBusy(true);
    try {
      await deleteReply(review.id);
      toast.success("Reply removed.");
      setReplyText("");
      onChanged?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove reply.";
      toast.error(msg);
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* ─── Header: avatar + name + time ─── */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-[var(--nexora-primary)]">
          {review.authorPhotoURL ? (
            <img
              src={review.authorPhotoURL}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            initials(review.authorName)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-gray-900">
              {authorDisplay}
            </p>
            {review.verified && (
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                Verified
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <StarRating value={review.rating} size="sm" />
            <span className="text-[10px] text-gray-400">{timeAgo}</span>
            {review.updatedAt > review.createdAt && (
              <span className="text-[10px] text-gray-400">(edited)</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      {review.text && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {review.text}
        </p>
      )}

      {/* ─── Owner reply ─── */}
      {review.reply && (
        <div className="mt-3 ml-6 rounded-xl border-l-2 border-[var(--nexora-primary)]/40 bg-blue-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--nexora-primary)]">
              <MessageCircle size={11} />
              Reply from provider
            </p>
            {isOwner && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyText(review.reply?.text ?? "");
                    setReplyOpen(true);
                  }}
                  disabled={replyBusy}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 disabled:opacity-50"
                  aria-label="Edit reply"
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={handleReplyDelete}
                  disabled={replyBusy}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete reply"
                >
                  {replyBusy ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Trash2 size={11} />
                  )}
                </button>
              </div>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
            {review.reply.text}
          </p>
        </div>
      )}

      {/* ─── Owner reply composer ─── */}
      {canReply && replyOpen && (
        <div className="mt-3 ml-6 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-700">
              {review.reply ? "Edit your reply" : "Write a reply"}
            </p>
            <button
              type="button"
              onClick={() => setReplyOpen(false)}
              disabled={replyBusy}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Cancel"
            >
              <X size={12} />
            </button>
          </div>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Thank the reviewer, clarify any details…"
            disabled={replyBusy}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">
              {replyText.length}/500
            </span>
            <button
              type="button"
              onClick={handleReplySubmit}
              disabled={replyBusy || !replyText.trim()}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--nexora-primary)] px-3 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {replyBusy && <Loader2 size={10} className="animate-spin" />}
              {review.reply ? "Save reply" : "Post reply"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer actions ─── */}
      {(isAuthor || (canReply && !review.reply && !replyOpen) || canReport) && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-2.5">
          {canReply && !review.reply && !replyOpen && (
            <button
              type="button"
              onClick={() => {
                setReplyText("");
                setReplyOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--nexora-primary)] transition-colors hover:underline"
            >
              <MessageCircle size={11} />
              Reply
            </button>
          )}

          {isAuthor && (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(review)}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50"
              >
                <Pencil size={11} />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-red-500 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
                Delete
              </button>
            </>
          )}

          {canReport && (
            <ReportButton
              targetType="review"
              targetId={review.id}
              targetTitle={review.text?.slice(0, 60) || "Review"}
              targetOwnerId={review.authorId}
            />
          )}
        </div>
      )}
    </div>
  );
}