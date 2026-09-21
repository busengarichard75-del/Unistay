"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useAuth } from "@/lib/AuthContext";
import { LoginRequiredModal } from "@/components/shared/LoginRequiredModal";

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
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const href = buildWhatsAppLink(whatsapp, message);
  if (!href) return null;

  const sizeClasses: Record<NonNullable<WhatsAppContactButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const iconSize = size === "lg" ? 18 : size === "md" ? 16 : 13;

  // ─── AUTH GATE ───
  // Guests must log in before contacting a provider.
  // We still render the <a> (so right-click / middle-click open normally
  // for power users, and SEO crawlers see the real link), but we intercept
  // the left-click for guests and show the login prompt instead.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
      return;
    }
    // Logged in → fire tracking as normal
    if (onTrack) onTrack();
  };

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center justify-center rounded-full bg-[#25D366] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${
          sizeClasses[size]
        } ${fullWidth ? "w-full" : ""} ${className}`}
        aria-label={label}
      >
        <MessageCircle size={iconSize} />
        {label}
      </a>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to contact"
        subtitle="Create a free Peza account to message this provider — it keeps everyone on Peza safe and accountable."
      />
    </>
  );
}