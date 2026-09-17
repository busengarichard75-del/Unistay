// src/components/shared/ShareButton.tsx
"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";

type ShareTargetType = "service" | "product" | "property";

interface ShareButtonProps {
  targetType: ShareTargetType;
  targetTitle: string;
  /** Optional custom URL. Defaults to current page URL. */
  url?: string;
}

function buildMessage(type: ShareTargetType, title: string, url: string): string {
  switch (type) {
    case "service":
      return `Check out this service on Peza: ${title}\n${url}`;
    case "product":
      return `Check out this deal on Peza: ${title}\n${url}`;
    case "property":
    default:
      return `Check out this room on Peza: ${title}\n${url}`;
  }
}

export function ShareButton({
  targetType,
  targetTitle,
  url,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    // Resolve URL — client-side only
    const shareUrl =
      url ||
      (typeof window !== "undefined" ? window.location.href : "");

    if (!shareUrl) return;

    const message = buildMessage(targetType, targetTitle, shareUrl);

    // 1) Try native share (mobile + modern desktop browsers)
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: `Peza — ${targetTitle}`,
          text: message,
          url: shareUrl,
        });
        setIsSharing(false);
        return;
      } catch (err: any) {
        // User cancelled share — no error toast
        setIsSharing(false);
        if (err?.name === "AbortError") return;
        // Fall through to copy on other errors
      }
    }

    // 2) Fallback — copy to clipboard
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const ta = document.createElement("textarea");
        ta.value = message;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("Link copied — share it on WhatsApp!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't share. Please copy the link manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isSharing}
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-[var(--nexora-primary)] disabled:opacity-50"
      title="Share this listing"
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}