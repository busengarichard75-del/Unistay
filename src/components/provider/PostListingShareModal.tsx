"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  X,
  CheckCircle2,
  Share2,
  Copy,
  MessageCircle,
  Store,
  ChevronRight,
} from "lucide-react";

interface PostListingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewListing: () => void;
  listingId: string;
  listingTitle: string;
  listingType: "service" | "product";
  ownerUid: string;
  ownerDisplayName: string;
}

// ─── Inline brand SVGs (lucide removed these icons) ───
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.87h2.77l-.44 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function PostListingShareModal({
  isOpen,
  onClose,
  onViewListing,
  listingId,
  listingTitle,
  listingType,
  ownerUid,
  ownerDisplayName,
}: PostListingShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const listingPath =
    listingType === "service"
      ? `/services/${listingId}`
      : `/marketplace/${listingId}`;
  const listingUrl = `${origin}${listingPath}`;
  const shopUrl = `${origin}/provider/${ownerUid}`;

  const listingMessage = `Check out my listing on Peza — ${listingTitle}\n\n${listingUrl}`;
  const shopMessage = `Check out my shop on Peza — ${ownerDisplayName}\n\n${shopUrl}`;

  const encodedListingMsg = encodeURIComponent(listingMessage);
  const encodedShopMsg = encodeURIComponent(shopMessage);
  const encodedListingUrl = encodeURIComponent(listingUrl);
  const encodedShopUrl = encodeURIComponent(shopUrl);

  const whatsappListing = `https://wa.me/?text=${encodedListingMsg}`;
  const whatsappShop = `https://wa.me/?text=${encodedShopMsg}`;
  const facebookListing = `https://www.facebook.com/sharer/sharer.php?u=${encodedListingUrl}`;
  const facebookShop = `https://www.facebook.com/sharer/sharer.php?u=${encodedShopUrl}`;
  const twitterListing = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out my listing on Peza — ${listingTitle}`
  )}&url=${encodedListingUrl}`;
  const twitterShop = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out my shop on Peza — ${ownerDisplayName}`
  )}&url=${encodedShopUrl}`;

  async function handleMore() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Check out my listing on Peza`,
          text: listingMessage,
          url: listingUrl,
        });
        return;
      } catch {
        // cancelled — silent
      }
    }
    await handleCopy(listingUrl);
  }

  async function handleCopy(url: string = listingUrl) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  const handleShareShop = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Check out my shop on Peza`,
          text: shopMessage,
          url: shopUrl,
        });
        return;
      } catch {
        // silent
      }
    }
    await handleCopy(shopUrl);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm px-3 py-3 sm:items-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Listing created — share it"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 px-5 pt-6 pb-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mt-3 text-lg font-bold">Listing created! 🎉</h2>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/90">
              Get your first customer faster by sharing it with your WhatsApp
              contacts and social media.
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Your listing
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
              {listingTitle}
            </p>
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Share this listing
          </p>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <a
              href={whatsappListing}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-3 transition-colors hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white">
                <MessageCircle size={16} fill="currentColor" />
              </span>
              <span className="text-[10px] font-medium text-gray-700">
                WhatsApp
              </span>
            </a>

            <a
              href={facebookListing}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-3 transition-colors hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white">
                <FacebookIcon size={16} />
              </span>
              <span className="text-[10px] font-medium text-gray-700">
                Facebook
              </span>
            </a>

            <a
              href={twitterListing}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-3 transition-colors hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                <TwitterIcon size={14} />
              </span>
              <span className="text-[10px] font-medium text-gray-700">
                X / Twitter
              </span>
            </a>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCopy(listingUrl)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={handleMore}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Share2 size={13} />
              More options
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareShop}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Store size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-900">
                  Or share your whole shop
                </p>
                <p className="text-[10px] text-indigo-700/80">
                  Everyone sees all your listings at once
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-indigo-500" />
          </button>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={onViewListing}
            className="flex-[2] rounded-xl bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
          >
            View my listing →
          </button>
        </div>
      </div>
    </div>
  );
}