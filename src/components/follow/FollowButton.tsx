// src/components/follow/FollowButton.tsx
"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  followProvider,
  unfollowProvider,
  subscribeToFollow,
} from "@/services/followService";
import { LoginRequiredModal } from "@/components/shared/LoginRequiredModal";
import { toast } from "sonner";

type FollowVariant = "full" | "icon" | "light";

interface FollowButtonProps {
  providerId: string;
  /** Denormalized display snapshots — written into the follow doc. */
  providerName?: string;
  providerPhotoURL?: string;
  /** How the button renders. */
  variant?: FollowVariant;
  /** Optional callback after a successful toggle. */
  onToggle?: (nowFollowing: boolean) => void;
}

export function FollowButton({
  providerId,
  providerName,
  providerPhotoURL,
  variant = "full",
  onToggle,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ─── Real-time follow state ───
  useEffect(() => {
    if (!user || !providerId) {
      setFollowing(false);
      return;
    }
    if (user.uid === providerId) return; // self-follow: no listener needed

    const unsub = subscribeToFollow(user.uid, providerId, (isFollowing) => {
      setFollowing(isFollowing);
    });
    return () => unsub();
  }, [user, providerId]);

  // ─── Self-follow: render nothing ───
  if (user && user.uid === providerId) return null;

  const handleClick = async (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // ── Guest gate ──
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (busy) return;
    setBusy(true);

    const wasFollowing = following;
    const next = !wasFollowing;
    // Optimistic flip
    setFollowing(next);

    try {
      if (next) {
        await followProvider({
          followerId: user.uid,
          providerId,
          followerName: user.businessName || user.fullName || undefined,
          followerPhotoURL: user.photoURL || undefined,
          providerName,
          providerPhotoURL,
        });
        toast.success("Following");
      } else {
        await unfollowProvider(user.uid, providerId);
        toast.success("Unfollowed");
      }
      onToggle?.(next);
    } catch (err) {
      // Revert on failure
      setFollowing(wasFollowing);
      console.error("Follow toggle failed:", err);
      toast.error(
        next ? "Couldn't follow. Try again." : "Couldn't unfollow. Try again."
      );
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // ICON variant — for cards (stacks with wishlist heart)
  // ─────────────────────────────────────────────────────────
  if (variant === "icon") {
    return (
      <>
        <span
          role="button"
          tabIndex={0}
          aria-label={following ? "Unfollow" : "Follow"}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick(e);
          }}
          className="pointer-events-auto inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform active:scale-90"
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin text-gray-700" />
          ) : following ? (
            <UserCheck size={12} className="text-[var(--nexora-primary)]" />
          ) : (
            <UserPlus size={12} className="text-gray-700" />
          )}
        </span>

        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Sign in to follow"
          subtitle="Create a free Peza account to follow providers and get notified when they post new listings."
        />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // LIGHT variant — for light-background cards (e.g., "Sold by")
  // ─────────────────────────────────────────────────────────
  if (variant === "light") {
    return (
      <>
        <span
          role="button"
          tabIndex={0}
          aria-label={following ? "Unfollow" : "Follow"}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick(e);
          }}
          className={`pointer-events-auto inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
            following
              ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              : "bg-[var(--nexora-primary)] text-white hover:opacity-90"
          }`}
        >
          {busy ? (
            <Loader2 size={11} className="animate-spin" />
          ) : following ? (
            <UserCheck size={11} />
          ) : (
            <UserPlus size={11} />
          )}
          {following ? "Following" : "Follow"}
        </span>

        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Sign in to follow"
          subtitle="Create a free Peza account to follow providers and get notified when they post new listings."
        />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // FULL variant — for provider profile header
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur transition-all active:scale-95 disabled:opacity-70 ${
          following
            ? "bg-white/25 text-white hover:bg-white/35"
            : "bg-white text-[var(--nexora-navy)] hover:bg-white/90"
        }`}
        aria-label={following ? "Unfollow" : "Follow"}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : following ? (
          <UserCheck size={14} />
        ) : (
          <UserPlus size={14} />
        )}
        {following ? "Following" : "Follow"}
      </button>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to follow"
        subtitle="Create a free Peza account to follow providers and get notified when they post new listings."
      />
    </>
  );
}