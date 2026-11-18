// src/components/campus-match/CampusMatchModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, User, Users, RefreshCw, AlertCircle, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as AppUser } from "@/types/user";
import { CampusMatchProfile, CampusMatchGender, CampusMatchLookingFor, CampusMatchSleep, CampusMatchCleanliness, CampusMatchNoise, CampusMatchStudyMode } from "@/types/campusMatch";
import { getMyCampusProfile, saveCampusProfile, getCampusMatches, deleteCampusProfile } from "@/services/campusMatchService";
import { CampusMatchCard } from "./CampusMatchCard";

interface CampusMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
}

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"];

export function CampusMatchModal({ isOpen, onClose, user }: CampusMatchModalProps) {
  const [view, setView] = useState<"form" | "matches">("form");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<CampusMatchProfile | null>(null);
  const [matches, setMatches] = useState<CampusMatchProfile[]>([]);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<CampusMatchGender>("M");
  const [yearOfStudy, setYearOfStudy] = useState(YEARS[0]);
  const [lookingFor, setLookingFor] = useState<CampusMatchLookingFor>("Both");
  const [sleepSchedule, setSleepSchedule] = useState<CampusMatchSleep>("Varies");
  const [cleanliness, setCleanliness] = useState<CampusMatchCleanliness>("Moderate");
  const [noiseTolerance, setNoiseTolerance] = useState<CampusMatchNoise>("Some noise ok");
  const [studyMode, setStudyMode] = useState<CampusMatchStudyMode>("Both");
  const [course, setCourse] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function loadData() {
      setIsLoading(true);
      const existing = await getMyCampusProfile(user.uid);
      if (!active) return;

      if (existing) {
        setProfile(existing);
        setFirstName(existing.firstName);
        setGender(existing.gender);
        setYearOfStudy(existing.yearOfStudy);
        setLookingFor(existing.lookingFor);
        setSleepSchedule(existing.sleepSchedule);
        setCleanliness(existing.cleanliness);
        setNoiseTolerance(existing.noiseTolerance);
        setStudyMode(existing.studyMode);
        setCourse(existing.course);
        setWhatsapp(existing.whatsapp);
        setBio(existing.bio || "");

        const fetchedMatches = await getCampusMatches(existing);
        if (!active) return;
        setMatches(fetchedMatches);
        setView("matches");
      } else {
        // Pre-fill what we can from their main account
        setFirstName(user.fullName?.split(" ")[0] || "");
        setWhatsapp(user.phone || "");
        setCourse(user.university || ""); // Fallback, they can edit
        setView("form");
      }
      setIsLoading(false);
    }

    loadData();
    return () => { active = false; };
  }, [isOpen, user]);

  async function handleSave() {
    if (!firstName.trim() || !whatsapp.trim() || !course.trim()) {
      toast.error("Please fill in your name, course, and WhatsApp number.");
      return;
    }
    if (!user.university) {
      toast.error("Your main profile is missing a university. Please update it in settings.");
      return;
    }

    setIsSaving(true);
    try {
      await saveCampusProfile(user.uid, {
        firstName: firstName.trim(),
        gender,
        university: user.university,
        yearOfStudy,
        lookingFor,
        sleepSchedule,
        cleanliness,
        noiseTolerance,
        studyMode,
        course: course.trim(),
        whatsapp: whatsapp.trim(),
        bio: bio.trim() || undefined,
      });

      // Re-fetch profile and matches
      const updated = await getMyCampusProfile(user.uid);
      if (updated) {
        setProfile(updated);
        const fetched = await getCampusMatches(updated);
        setMatches(fetched);
        setView("matches");
        toast.success("Profile saved! Here are your matches.");
      }
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure? This will remove you from Campus Match.")) return;
    try {
      await deleteCampusProfile(user.uid);
      setProfile(null);
      setMatches([]);
      setView("form");
      toast.success("Profile removed.");
    } catch {
      toast.error("Failed to delete profile.");
    }
  }

  async function handleReport(reportedUid: string, reportedName: string) {
    if (!window.confirm(`Report ${reportedName} for inappropriate behavior?`)) return;
    try {
      await addDoc(collection(db, "reports"), {
        reporterId: user.uid,
        targetId: reportedUid,
        targetType: "user",
        targetName: reportedName,
        reason: "Inappropriate Campus Match profile",
        status: "pending",
        createdAt: Date.now(),
      });
      toast.success("Report submitted. Our team will review it.");
    } catch {
      toast.error("Failed to submit report.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4" onClick={onClose}>
      <div 
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-gray-50 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Campus Match
            </h2>
            <p className="text-xs text-gray-500">
              {view === "form" ? "Tell us about your study & living habits." : `You have ${matches.length} matches at ${user.university}.`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher (Only if profile exists) */}
        {profile && (
          <div className="flex border-b border-gray-200 bg-white px-6">
            <button
              onClick={() => setView("matches")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${view === "matches" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Users size={16} /> My Matches
            </button>
            <button
              onClick={() => setView("form")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${view === "form" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <User size={16} /> Edit Profile
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : view === "form" ? (
            
            /* ─── FORM VIEW ─── */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Richard" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">WhatsApp Number</label>
                  <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. 0971234567" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Course / Programme</label>
                  <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Computer Science" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Year of Study</label>
                  <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as CampusMatchGender)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">I am looking for a...</label>
                  <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value as CampusMatchLookingFor)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    <option value="Roommate">Roommate</option>
                    <option value="Study partner">Study partner</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Sleep Schedule</label>
                  <select value={sleepSchedule} onChange={(e) => setSleepSchedule(e.target.value as CampusMatchSleep)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    <option value="Early bird">Early bird</option>
                    <option value="Night owl">Night owl</option>
                    <option value="Varies">Varies</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Cleanliness</label>
                  <select value={cleanliness} onChange={(e) => setCleanliness(e.target.value as CampusMatchCleanliness)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    <option value="Very clean">Very clean</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Relaxed">Relaxed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Noise Tolerance</label>
                  <select value={noiseTolerance} onChange={(e) => setNoiseTolerance(e.target.value as CampusMatchNoise)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    <option value="Quiet">Quiet</option>
                    <option value="Some noise ok">Some noise is okay</option>
                    <option value="Social">Social / Loud</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Study Mode</label>
                  <select value={studyMode} onChange={(e) => setStudyMode(e.target.value as CampusMatchStudyMode)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                    <option value="Solo">Solo</option>
                    <option value="Group">Group</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Short Bio (Optional, max 100 chars)</label>
                  <input type="text" maxLength={100} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. I'm quiet, clean, and love coding." className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {profile ? (
                  <button onClick={handleDelete} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700">
                    <Trash2 size={14} /> Delete Profile
                  </button>
                ) : <div />}
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : profile ? "Save & See Matches" : "Create Profile & Find Matches"}
                  {!isSaving && <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>

          ) : (

            /* ─── MATCHES VIEW ─── */
            <div>
              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                  <AlertCircle size={32} className="mb-3 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-800">No matches yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    You're the first one with these preferences at your university! Check back later as more students join Campus Match.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((m) => (
                    <CampusMatchCard key={m.uid} profile={m} onReport={handleReport} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}