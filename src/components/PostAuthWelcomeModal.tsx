// src/components/PostAuthWelcomeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  ArrowRight,
  Home,
  Wrench,
  ShoppingBag,
  Plus,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const SESSION_KEY = "peza_post_auth_welcome_shown";

export function PostAuthWelcomeModal() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const firstAuthStateSeenRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLoading) return;

    // First time we know the auth state — record whether we mounted logged-in
    if (!firstAuthStateSeenRef.current) {
      firstAuthStateSeenRef.current = true;
      // If we mounted with a user already active → they had a session, don't nag
      if (user) return;
      return;
    }

    // From here on, this is a *transition* event
    if (!user) return;

    // Already shown this session? Don't nag
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    // If they had a session already open (>30s since mount), skip — the login happened a while ago
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed > 30000) return;

    // Show with a slight delay so the page settles
    const t = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    }, 800);

    return () => clearTimeout(t);
  }, [user, isLoading]);

  if (!user || !isOpen) return null;

  // ─── Personalization ───
  const firstName =
    (user.fullName || "").trim().split(" ")[0] ||
    (user.email || "").split("@")[0] ||
    "there";

  const isProvider = user.role === "service_provider";
  const providerType = user.providerType === "product" ? "Product Seller" : "Service Provider";

  // ─── CTA 1: Add listing (providers) / Become provider (students) ───
  const primaryTile = isProvider
    ? {
        icon: <Plus size={18} />,
        title: "Add a Listing",
        line: `Grow your ${providerType.toLowerCase()} shop`,
        gradient: "from-emerald-500 to-green-600",
        badge: "START",
        href: "/dashboard/provider/add-listing",
      }
    : {
        icon: <Store size={18} />,
        title: "Become a Provider",
        line: "Sell services or products on Peza",
        gradient: "from-emerald-500 to-green-600",
        badge: "NEW",
        href: "/signup/provider",
      };

  const tiles = [
    primaryTile,
    {
      icon: <Wrench size={18} />,
      title: "Browse Services",
      line: "Barbers, printing, repairs & more",
      gradient: "from-cyan-500 to-teal-600",
      href: "/services",
    },
    {
      icon: <ShoppingBag size={18} />,
      title: "Marketplace",
      line: "Buy and sell with students",
      gradient: "from-orange-500 to-pink-600",
      href: "/marketplace",
    },
    {
      icon: <Home size={18} />,
      title: "Accommodation",
      line: "Verified rooms near your campus",
      gradient: "from-blue-500 to-indigo-600",
      href: "/",
    },
  ];

  const handleClose = () => setIsOpen(false);

  const handleGo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--nexora-primary)] to-[var(--nexora-primary-hover)] px-6 pt-8 pb-6 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles size={28} />
            </div>
            <h2 className="mt-3 text-2xl font-bold">
              Welcome{isProvider ? " back" : ""}, {firstName}!
            </h2>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/90">
              {isProvider
                ? "Your shop is ready. What do you want to do today?"
                : "Everything you need for campus life — in one place."}
            </p>
          </div>
        </div>

        {/* Tiles */}
        <div className="space-y-2 px-5 py-5">
          {tiles.map((t) => (
            <button
              key={t.href + t.title}
              type="button"
              onClick={() => handleGo(t.href)}
              className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${t.gradient} text-white shadow-sm`}
              >
                {t.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                  {"badge" in t && t.badge && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-700">
                      {t.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">
                  {t.line}
                </p>
              </div>
              <ArrowRight
                size={14}
                className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--nexora-primary)]"
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 text-center">
          <button
            onClick={handleClose}
            className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}