// src/components/landlord/LandlordOnboardingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Plus, ArrowRight, X, Building, Sparkles } from "lucide-react";

interface LandlordOnboardingModalProps {
  landlordName?: string;
}

export function LandlordOnboardingModal({ landlordName = "Landlord" }: LandlordOnboardingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the landlord has already seen the modal
    const hasSeen = localStorage.getItem("peza_landlord_onboarding_seen");
    if (hasSeen !== "true") {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("peza_landlord_onboarding_seen", "true");
  };

  const handleAddListing = () => {
    setIsOpen(false);
    localStorage.setItem("peza_landlord_onboarding_seen", "true");
    router.push("/dashboard/landlord/add-listing");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-primary-hover)] text-white shadow-lg">
          <Building size={28} />
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Welcome, {landlordName}! 👋
        </h2>

        {/* Description */}
        <p className="mt-2 text-center text-sm text-gray-600">
          You're all set to start listing your properties on Peza.
        </p>

        {/* Features list */}
        <div className="mt-4 space-y-2 rounded-xl bg-blue-50 p-4">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <Sparkles size={16} className="text-blue-600" />
            <span>List your property completely free</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <Home size={16} className="text-blue-600" />
            <span>Connect with students near your campus</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <Plus size={16} className="text-blue-600" />
            <span>Boost your listing for extra visibility</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleAddListing}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-primary-hover)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <Plus size={18} />
            Add Your First Listing
            <ArrowRight size={16} />
          </button>

          <button
            onClick={handleDismiss}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Maybe later – go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}