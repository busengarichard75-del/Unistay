"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface WhatsAppContactButtonProps {
  whatsapp: string;
  message: string;
  onTrack?: () => void;
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function WhatsAppContactButton({
  whatsapp,
  message,
  onTrack,
  className = "",
  label = "Chat on WhatsApp",
  size = "md",
  fullWidth = false,
}: WhatsAppContactButtonProps) {
  const href = buildWhatsAppLink(whatsapp, message);
  if (!href) return null;

  const sizeClasses: Record<NonNullable<WhatsAppContactButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const iconSize = size === "lg" ? 18 : size === "md" ? 16 : 13;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (onTrack) onTrack();
      }}
      className={`inline-flex items-center justify-center rounded-full bg-[#25D366] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${
        sizeClasses[size]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      aria-label={label}
    >
      <MessageCircle size={iconSize} />
      {label}
    </a>
  );
}