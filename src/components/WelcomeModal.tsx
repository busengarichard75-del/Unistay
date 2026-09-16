"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  ArrowRight,
  Home,
  Wrench,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export function WelcomeModal() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show for guests (not logged in)
    if (user) return;

    // Check if user has already seen the modal
    const hasSeen = localStorage.getItem("peza_welcome_seen");
    if (hasSeen === "true") return;

    // Show modal after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem("peza_welcome_seen", "true");
    setIsOpen(false);
  };

  const handleClose = () => dismiss();

  const handleLogin = () => {
    dismiss();
    router.push("/login");
  };

  const handleSignup = () => {
    dismiss();
    router.push("/signup");
  };

  const handleExplore = (href: string) => {
    dismiss();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-primary-hover)] text-white shadow-lg">
          <Sparkles size={28} />
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Welcome to Peza 🎉
        </h2>

        {/* Subtitle */}
        <p className="mt-2 text-center text-sm text-gray-600">
          <span className="font-semibold text-[var(--nexora-primary)]">
            Find what you need.
          </span>
          <br />
          Rooms, services, and products — all in one place.
        </p>

        {/* ─── 3 Peza Sections ─── */}
        <div className="mt-5 space-y-2">
          <SectionTile
            icon={<Home size={18} />}
            title="Accommodation"
            line="Verified rooms near your campus"
            gradient="from-blue-500 to-indigo-600"
            onClick={() => handleExplore("/")}
          />
          <SectionTile
            icon={<Wrench size={18} />}
            title="Services"
            line="Barbers, printing, repairs & more"
            gradient="from-cyan-500 to-teal-600"
            badge="NEW"
            onClick={() => handleExplore("/services")}
          />
          <SectionTile
            icon={<ShoppingBag size={18} />}
            title="Marketplace"
            line="Buy and sell with students"
            gradient="from-orange-500 to-pink-600"
            badge="NEW"
            onClick={() => handleExplore("/marketplace")}
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSignup}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-primary-hover)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            Get Started – Sign Up
            <ArrowRight size={18} />
          </button>

          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Log In to your account
          </button>

          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            I&apos;m just browsing – continue without signing up
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────── */
/* Section Tile                                    */
/* ──────────────────────────────────────────────── */

function SectionTile({
  icon,
  title,
  line,
  gradient,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  line: string;
  gradient: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {badge && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-700">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-gray-500">{line}</p>
      </div>
      <ArrowRight
        size={14}
        className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--nexora-primary)]"
      />
    </button>
  );
}