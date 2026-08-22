"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { universities } from "@/data/universities";
import { Preferences, PriorityWeights } from "@/lib/recommendation/types";
import { useAuth } from "@/lib/AuthContext";

interface PreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: "budget", title: "💰 Budget", description: "How much can you spend per month?" },
  { id: "university", title: "🏛️ University", description: "Where are you studying?" },
  { id: "distance", title: "🚶 Distance", description: "How far are you willing to walk?" },
  { id: "priorities", title: "🎯 Priorities", description: "What matters most to you?" },
  { id: "amenities", title: "🛠️ Amenities", description: "What do you need?" },
];

export function PreferenceModal({ isOpen, onClose }: PreferenceModalProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(0);
  const [budgetMax, setBudgetMax] = useState(1500);
  const [universityId, setUniversityId] = useState("");
  const [maxWalkingMinutes, setMaxWalkingMinutes] = useState(15);
  const [priorities, setPriorities] = useState<PriorityWeights>({
    budget: 0.35,
    distance: 0.25,
    amenities: 0.15,
    availability: 0.15,
    security: 0.1,
  });
  const [requiredAmenities, setRequiredAmenities] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const prefs: Preferences = {
      budgetMax,
      universityId: universityId || undefined,
      maxWalkingMinutes,
      priorities,
      requiredAmenities,
      genderPreference: "mixed",
    };

    // Save preferences to Firestore
    if (user) {
      setIsSaving(true);
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          preferences: prefs,
          university: universityId || user.university, // if they selected a university, use it
        });
        // Refresh the user context so the UI updates
        if (refreshUser) await refreshUser();
        toast.success("Preferences saved!");
      } catch (error) {
        console.error("Failed to save preferences:", error);
        toast.error("Could not save your preferences, but we'll still find your matches.");
      } finally {
        setIsSaving(false);
      }
    }

    // Redirect to results page with preferences in URL
    const params = new URLSearchParams({
      prefs: JSON.stringify(prefs),
    });
    onClose();
    router.push(`/find-my-best-house/results?${params.toString()}`);
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleAmenity = (amenity: string) => {
    setRequiredAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl animate-slide-up sm:rounded-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--nexora-navy)]">{steps[step].title}</h2>
            <p className="text-xs text-gray-500">{steps[step].description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-[var(--nexora-primary)] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="space-y-4 min-h-[200px]">
          {step === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum monthly budget (K)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-lg font-semibold focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[800, 1000, 1500, 2000, 3000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBudgetMax(val)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      budgetMax === val
                        ? "bg-[var(--nexora-primary)] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    K{val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your University</label>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
              >
                <option value="">Any university</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum walking time (minutes)
              </label>
              <select
                value={maxWalkingMinutes}
                onChange={(e) => setMaxWalkingMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--nexora-primary)] focus:ring-1 focus:ring-[var(--nexora-primary)]"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={999}>I don't mind walking</option>
              </select>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Adjust the sliders to set your priorities</p>
              <div className="space-y-4">
                {[
                  { key: "budget", label: "💰 Budget" },
                  { key: "distance", label: "🚶 Distance" },
                  { key: "amenities", label: "🛠️ Amenities" },
                  { key: "availability", label: "🛏️ Availability" },
                  { key: "security", label: "🔐 Security" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span>{Math.round((priorities as any)[key] * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={(priorities as any)[key]}
                      onChange={(e) =>
                        setPriorities((prev) => ({
                          ...prev,
                          [key]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Select the amenities you need (optional)</p>
              <div className="flex flex-wrap gap-2">
                {["Wi-Fi", "Electricity", "Water", "Security", "Parking", "Generator", "Laundry", "Kitchen"].map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      requiredAmenities.includes(a)
                        ? "bg-[var(--nexora-primary)] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {requiredAmenities.includes(a) && <Check size={14} className="inline mr-1" />}
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)] transition-colors disabled:opacity-50"
          >
            {step === steps.length - 1 ? (
              <>
                {isSaving ? "Saving..." : "Find Matches"} <Sparkles size={16} />
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}