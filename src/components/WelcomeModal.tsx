"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Heart, ArrowRight, Users, Home } from "lucide-react";
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

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("peza_welcome_seen", "true");
  };

  const handleLogin = () => {
    setIsOpen(false);
    localStorage.setItem("peza_welcome_seen", "true");
    router.push("/login");
  };

  const handleSignup = () => {
    setIsOpen(false);
    localStorage.setItem("peza_welcome_seen", "true");
    router.push("/signup");
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
          Welcome to Peza 🏠
        </h2>

        {/* Subtitle */}
        <p className="mt-2 text-center text-sm text-gray-600">
          Your journey to finding the perfect student accommodation starts here.
          <br />
          <span className="font-medium text-[var(--nexora-primary)]">
            Discover, book, and move in with confidence.
          </span>
        </p>

        {/* ─── Dual Welcome Message ─── */}
        <div className="mt-4 space-y-2 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-3 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600 shrink-0" />
            <span>
              <span className="font-semibold">🎓 For Students:</span> Find verified rooms near your campus.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Home size={16} className="text-purple-600 shrink-0" />
            <span>
              <span className="font-semibold">🏠 For Landlords:</span> List your property and connect with students.
            </span>
          </div>
          <p className="mt-1 text-center text-[11px] text-gray-500">
            Join thousands of students and landlords already on Peza.
          </p>
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
            I'm just browsing – continue without signing up
          </button>
        </div>
      </div>
    </div>
  );
}