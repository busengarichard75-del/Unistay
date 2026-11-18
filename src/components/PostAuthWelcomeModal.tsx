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
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createAskPezaRequest } from "@/services/askPezaService";

const SESSION_KEY = "peza_post_auth_welcome_shown";

export function PostAuthWelcomeModal() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const firstAuthStateSeenRef = useRef<boolean>(false);

  // ⭐ Ask Peza State
  const [requestText, setRequestText] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!firstAuthStateSeenRef.current) {
      firstAuthStateSeenRef.current = true;
      if (user) return;
      return;
    }
    if (!user) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) {
      return;
    }
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed > 30000) return;

    const t = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    }, 800);

    return () => clearTimeout(t);
  }, [user, isLoading]);

  if (!user || !isOpen) return null;

  const firstName =
    (user.fullName || "").trim().split(" ")[0] ||
    (user.email || "").split("@")[0] ||
    "there";

  const isProvider = user.role === "service_provider";
  const providerType = user.providerType === "product" ? "Product Seller" : "Service Provider";

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

  // ⭐ Handle Ask Peza Submission
  const handleAskPeza = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim() || !phone.trim()) {
      toast.error("Please tell us what you need and your WhatsApp number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAskPezaRequest({
        userId: user.uid,
        userName: user.fullName || user.email || "Student",
        userPhone: phone.trim(),
        requestText: requestText.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        className="relative max-h-[95vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
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
              Welcome{isProvider ? " back" : ""}, {firstName}! 👋
            </h2>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/90">
              {isProvider
                ? "Your shop is ready. What do you want to do today?"
                : "Everything you need for campus life — in one place."}
            </p>
          </div>
        </div>

        {/* ⭐ ASK PEZA CONCIERGE SECTION */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-5 py-5 border-b border-gray-100">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-4 text-center animate-in zoom-in-95">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">We got it! 🕵️‍♂️</h3>
              <p className="mt-1 text-sm text-gray-600 max-w-[250px]">
                Our team is finding this for you right now. We'll contact you on WhatsApp as soon as we have it! 🚀
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-4 text-xs font-semibold text-purple-600 hover:underline"
              >
                Ask for something else
              </button>
            </div>
          ) : (
            <form onSubmit={handleAskPeza} className="animate-in fade-in">
              <div className="mb-3">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-purple-900">
                  <Sparkles size={16} className="text-purple-600 animate-pulse" />
                  Need something? Tell us!
                </h3>
                <p className="text-[11px] font-medium text-purple-700/80 mt-0.5">
                  🇿🇲 <em>Mulefwaya inshi? Tufwaye! (Bemba)</em> <br/>
                  🇿🇲 <em>Muyanda nzi? Tumiyadwiide! (Tonga)</em>
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="e.g. Scientific calculator under K200..."
                  className="w-full rounded-xl border-2 border-purple-100 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500 transition-colors"
                  disabled={isSubmitting}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your WhatsApp number (e.g. 097...)"
                  className="w-full rounded-xl border-2 border-purple-100 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500 transition-colors"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !requestText.trim() || !phone.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSubmitting ? "Sending..." : "Find It For Me 🚀"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tiles */}
        <div className="space-y-2 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Or explore Peza
          </p>
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