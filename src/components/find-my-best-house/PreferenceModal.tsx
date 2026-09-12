// src/components/find-my-best-house/PreferenceModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, ArrowRight, ArrowLeft, Sparkles, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { universities } from "@/data/universities";
import { Preferences, MustHaveKey, ComfortKey } from "@/lib/recommendation/types";
import { useAuth } from "@/lib/AuthContext";

interface PreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 4;

const MUST_HAVES: { key: MustHaveKey; label: string; icon: string }[] = [
  { key: "private_bathroom", label: "Private bathroom", icon: "🚿" },
  { key: "backup_power", label: "Backup power / Generator", icon: "⚡" },
  { key: "borehole_water", label: "Borehole water", icon: "💧" },
  { key: "wifi", label: "WiFi", icon: "📶" },
  { key: "gated_compound", label: "Gated compound", icon: "🚪" },
  { key: "female_only", label: "Female-only compound", icon: "👩" },
  { key: "male_only", label: "Male-only compound", icon: "👨" },
];

const COMFORTS: { key: ComfortKey; label: string; icon: string }[] = [
  { key: "study_desk", label: "Study desk", icon: "📚" },
  { key: "wardrobe", label: "Wardrobe", icon: "🗄️" },
  { key: "ceiling_fan", label: "Ceiling fan", icon: "🌀" },
  { key: "hot_water", label: "Hot water", icon: "🔥" },
  { key: "tiled_floors", label: "Tiled floors", icon: "🧱" },
  { key: "shared_kitchen", label: "Shared kitchen", icon: "🍳" },
  { key: "cctv", label: "CCTV", icon: "🎥" },
  { key: "solar", label: "Solar power", icon: "☀️" },
];

const BUDGET_PRESETS = [800, 1000, 1500, 2000, 3000];

export function PreferenceModal({ isOpen, onClose }: PreferenceModalProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Layer 1
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);
  const [paymentPeriod, setPaymentPeriod] = useState<"monthly" | "termly" | "semester" | "any">("any");
  const [maxWalkingMinutes, setMaxWalkingMinutes] = useState<number | undefined>(undefined);
  const [roomType, setRoomType] = useState<"single" | "top_bunk" | "bottom_bunk" | "any">("any");
  const [universityId, setUniversityId] = useState("");

  // Layer 2
  const [mustHaves, setMustHaves] = useState<MustHaveKey[]>([]);
  const [genderPreference, setGenderPreference] = useState<"male" | "female" | "mixed">("mixed");

  // Layer 3
  const [comforts, setComforts] = useState<ComfortKey[]>([]);

  // Layer 4
  const [vibe, setVibe] = useState<"quiet" | "social" | "any">("any");
  const [roommates, setRoommates] = useState<"alone" | "ok_with_others" | "any">("any");
  const [moveInTiming, setMoveInTiming] = useState<"this_week" | "this_month" | "next_term" | "flexible">("flexible");

  // ─── Reset on close ──────────────────────────────────────────
  const resetAll = () => {
    setStep(0);
    setBudgetMax(undefined);
    setPaymentPeriod("any");
    setMaxWalkingMinutes(undefined);
    setRoomType("any");
    setUniversityId("");
    setMustHaves([]);
    setGenderPreference("mixed");
    setComforts([]);
    setVibe("any");
    setRoommates("any");
    setMoveInTiming("flexible");
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ─── Save + navigate ─────────────────────────────────────────
  const handleSubmit = async (completedUpTo: number) => {
    const prefs: Preferences = {
      budgetMax,
      paymentPeriod,
      maxWalkingMinutes,
      roomType,
      universityId: universityId || undefined,
      mustHaves: mustHaves.length > 0 ? mustHaves : undefined,
      genderPreference,
      comforts: comforts.length > 0 ? comforts : undefined,
      vibe,
      roommates,
      moveInTiming,
      completedLayers: completedUpTo as 0 | 1 | 2 | 3 | 4,
    };

    if (user) {
      setIsSaving(true);
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          preferences: prefs,
          ...(universityId ? { university: universityId } : {}),
        });
        if (refreshUser) await refreshUser();
      } catch {
        // Silent — we still route to results
      } finally {
        setIsSaving(false);
      }
    }

    const params = new URLSearchParams({
      prefs: JSON.stringify(prefs),
    });
    handleClose();
    router.push(`/find-my-best-house/results?${params.toString()}`);
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleSubmit(TOTAL_STEPS);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const searchNow = () => handleSubmit(step + 1);

  const toggleMustHave = (key: MustHaveKey) => {
    setMustHaves((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleComfort = (key: ComfortKey) => {
    setComforts((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (!isOpen) return null;

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Step {step + 1} of {TOTAL_STEPS}
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--nexora-navy)]">
                {step === 0 && "🎓 Essentials"}
                {step === 1 && "⚡ Must-Haves"}
                {step === 2 && "🛋️ Comfort"}
                {step === 3 && "✨ Vibe"}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {step === 0 && "The basics — where and how much"}
                {step === 1 && "Things you can't live without"}
                {step === 2 && "Nice touches that make a room feel like home"}
                {step === 3 && "One last thing about your lifestyle"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-navy)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-xl bg-blue-50/60 border border-blue-100 p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-[var(--nexora-primary)]" />
            <p className="text-[11px] leading-relaxed text-gray-600">
              Answer what matters. You can stop anytime — we'll search with
              whatever you've given us and match you as best we can.
            </p>
          </div>

          {/* ─── STEP 1: ESSENTIALS ─── */}
          {step === 0 && (
            <div className="space-y-5">
              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum monthly budget (K)
                </label>
                <input
                  type="number"
                  value={budgetMax ?? ""}
                  onChange={(e) =>
                    setBudgetMax(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="e.g., 1500"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
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

              {/* Payment period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment period OK?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "monthly", l: "Monthly" },
                    { v: "termly", l: "Termly" },
                    { v: "semester", l: "Semester" },
                    { v: "any", l: "Any" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPaymentPeriod(v as any)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                        paymentPeriod === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Walk time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max walk to campus
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 5, l: "<5 min" },
                    { v: 10, l: "<10 min" },
                    { v: 15, l: "<15 min" },
                    { v: 20, l: "<20 min" },
                    { v: 30, l: "<30 min" },
                    { v: 999, l: "Any" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMaxWalkingMinutes(v)}
                      className={`rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                        maxWalkingMinutes === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "single", l: "Single room" },
                    { v: "top_bunk", l: "Top bunk" },
                    { v: "bottom_bunk", l: "Bottom bunk" },
                    { v: "any", l: "Any" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRoomType(v as any)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                        roomType === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* University */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University
                </label>
                <select
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 outline-none"
                >
                  <option value="">Any university</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ─── STEP 2: MUST-HAVES ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Tick what you truly need. Leave the rest blank — we'll show more options.
                </p>
                <div className="space-y-2">
                  {MUST_HAVES.map(({ key, label, icon }) => {
                    const active = mustHaves.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMustHave(key)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                          active
                            ? "border-[var(--nexora-primary)] bg-blue-50/60"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{icon}</span>
                          <span className="text-sm text-gray-800">{label}</span>
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                            active
                              ? "bg-[var(--nexora-primary)] text-white"
                              : "border border-gray-300"
                          }`}
                        >
                          {active && <Check size={12} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gender preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compound type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "female", l: "Female only" },
                    { v: "male", l: "Male only" },
                    { v: "mixed", l: "Any" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGenderPreference(v as any)}
                      className={`rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                        genderPreference === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: COMFORT ─── */}
          {step === 2 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Pick what would make a room feel like home. These boost your match score — they don't filter out properties.
              </p>
              <div className="flex flex-wrap gap-2">
                {COMFORTS.map(({ key, label, icon }) => {
                  const active = comforts.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleComfort(key)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                        active
                          ? "bg-[var(--nexora-primary)] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span>{icon}</span>
                      {label}
                      {active && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── STEP 4: VIBE ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred vibe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "quiet", l: "🎧 Quiet" },
                    { v: "social", l: "🎉 Social" },
                    { v: "any", l: "Any" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVibe(v as any)}
                      className={`rounded-xl border py-3 text-sm font-medium transition-colors ${
                        vibe === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roommates
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "alone", l: "Prefer alone" },
                    { v: "ok_with_others", l: "OK with others" },
                    { v: "any", l: "Any" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRoommates(v as any)}
                      className={`rounded-xl border py-3 text-xs font-medium transition-colors ${
                        roommates === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When do you want to move in?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "this_week", l: "This week" },
                    { v: "this_month", l: "This month" },
                    { v: "next_term", l: "Next term" },
                    { v: "flexible", l: "Flexible" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMoveInTiming(v as any)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                        moveInTiming === v
                          ? "border-[var(--nexora-primary)] bg-blue-50/60 text-[var(--nexora-navy)]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {/* Search Now — skip remaining steps */}
              {step < TOTAL_STEPS - 1 && (
                <button
                  type="button"
                  onClick={searchNow}
                  disabled={isSaving}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Search Now
                </button>
              )}

              <button
                type="button"
                onClick={nextStep}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {step === TOTAL_STEPS - 1 ? (
                  <>
                    {isSaving ? "Finding..." : "Find My Best House"}
                    <Sparkles size={16} />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}