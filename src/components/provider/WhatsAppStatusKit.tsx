// src/components/provider/WhatsAppStatusKit.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, QrCode, MessageCircle } from "lucide-react";

interface WhatsAppStatusKitProps {
  uid: string;
  displayName: string;
  tagline?: string;
}

export function WhatsAppStatusKit({
  uid,
  displayName,
  tagline,
}: WhatsAppStatusKitProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // SSR-safe shop URL — falls back to production domain during pre-render
  const shopUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/provider/${uid}`
      : `https://peza-zm.vercel.app/provider/${uid}`;

  const taglineLine = tagline ? ` ${tagline}` : "";

  const templates = [
    {
      key: "status",
      label: "WhatsApp Status",
      hint: "Post on your status — everyone sees it",
      text: `🛍️ ${displayName}${taglineLine}\n\nFind me on Peza 👇\n${shopUrl}`,
    },
    {
      key: "bio",
      label: "Profile bio",
      hint: "Paste in WhatsApp Business → About",
      text: `${displayName} on Peza → ${shopUrl}`,
    },
    {
      key: "reply",
      label: "Reply to customers",
      hint: "Send when someone asks what you do",
      text: `Hi 👋 Here's my shop on Peza — everything I offer, with prices:\n${shopUrl}\n\nChat me back if you need anything.`,
    },
  ];

  async function handleCopy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied — paste in WhatsApp");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the text to select.");
    }
  }

  const qrApiUrl = (size: number) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(shopUrl)}`;

  return (
    <section className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <MessageCircle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900">
            WhatsApp Status Kit
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Copy-paste to WhatsApp — turn chats into clients
          </p>
        </div>
      </div>

      {/* Templates */}
      <div className="mt-4 space-y-2">
        {templates.map((t) => {
          const copied = copiedKey === t.key;
          return (
            <div
              key={t.key}
              className="rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {t.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{t.hint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(t.key, t.text)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={11} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2 text-[11px] text-gray-600">
                {t.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* QR code */}
      <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-white p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <QrCode size={12} />
          Your shop QR
        </div>
        <img
          src={qrApiUrl(400)}
          alt="Shop QR code"
          width={180}
          height={180}
          className="rounded-lg border border-gray-100"
          loading="lazy"
        />
        <p className="max-w-xs text-center text-[10px] text-gray-400">
          Long-press or screenshot to save. Print it, put it on your poster,
          or set it as your WhatsApp profile pic.
        </p>
      </div>
    </section>
  );
}