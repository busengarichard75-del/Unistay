// src/app/campus-match/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, RefreshCw, AlertCircle, CheckCircle2, Heart, BookOpen, Home, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { BackButton } from "@/components/ui/BackButton";
import { CampusMatchProfile, CampusMatchGender, CampusMatchLookingFor, CampusMatchSleep, CampusMatchCleanliness, CampusMatchNoise, CampusMatchStudyMode } from "@/types/campusMatch";
import { getMyCampusProfile, saveCampusProfile, getCampusMatches } from "@/services/campusMatchService";
import { CampusMatchCard } from "@/components/campus-match/CampusMatchCard";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { universities } from "@/data/universities"; 

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"];
type TabType = "Roommates" | "Study partner" | "Partner";

export default function CampusMatchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<CampusMatchProfile | null>(null);
  const [allMatches, setAllMatches] = useState<CampusMatchProfile[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("Roommates");
  const [isEditing, setIsEditing] = useState(false);
  
  const [filterCampus, setFilterCampus] = useState<string>("All");

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
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function loadData() {
      const existing = await getMyCampusProfile(user!.uid);
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
        setPhotoUrl(existing.photoUrl || "");

        const fetchedMatches = await getCampusMatches(existing);
        setAllMatches(fetchedMatches);
      } else {
        setFirstName(user!.fullName?.split(" ")[0] || "");
        setWhatsapp(user!.phone || "");
        setCourse(""); 
        setIsEditing(true);
      }
      setIsFetching(false);
    }

    loadData();
  }, [user, authLoading, router]);

  async function handleSave() {
    if (!firstName.trim() || !whatsapp.trim() || !course.trim()) {
      toast.error("Please fill in your name, course, and WhatsApp number.");
      return;
    }
    if (!user?.university) {
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
        photoUrl: photoUrl || undefined,
      });

      const updated = await getMyCampusProfile(user.uid);
      if (updated) {
        setProfile(updated);
        const fetched = await getCampusMatches(updated);
        setAllMatches(fetched);
        setIsEditing(false);
        toast.success("Profile saved! Here are your matches.");
      }
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReport(reportedUid: string, reportedName: string) {
    if (!window.confirm(`Report ${reportedName} for inappropriate behavior?`)) return;
    toast.success("Report submitted. Our team will review it.");
  }

  if (authLoading || isFetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <RefreshCw className="animate-spin text-[var(--nexora-primary)]" size={32} />
      </main>
    );
  }

  if (!user) return null;

  const tabFiltered = allMatches.filter(m => {
    if (activeTab === "Roommates") return m.lookingFor === "Roommate" || m.lookingFor === "Both";
    if (activeTab === "Study partner") return m.lookingFor === "Study partner" || m.lookingFor === "Both";
    if (activeTab === "Partner") return m.lookingFor === "Partner";
    return true;
  });

  const finalMatches = tabFiltered.filter(m => {
    if (filterCampus === "All") return true;
    return m.university === filterCampus;
  });

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        <div className="mb-6 flex items-center justify-between">
          <BackButton />
          {profile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Edit My Profile
            </button>
          )}
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <Users size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {profile && !isEditing ? "Find Your Match" : "Create Your Profile"}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
            Match with students across all campuses in Zambia who share your living habits, study styles, or are looking for a connection.
          </p>
        </div>

        {isEditing || !profile ? (
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl border border-gray-100 sm:p-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Profile Photo</label>
                <ImageUploader 
                  initialImage={photoUrl} 
                  onUpload={(url) => setPhotoUrl(url)} 
                />
              </div>

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
                  <option value="Partner">Partner</option>
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
                <label className="mb-1 block text-xs font-semibold text-gray-700">Short Bio (Optional)</label>
                <textarea maxLength={150} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people a bit about yourself..." className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" rows={3} />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
              {profile && (
                <button onClick={() => setIsEditing(false)} className="rounded-xl px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
              )}
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : profile ? "Save Changes" : "Create Profile & Find Matches"}
                {!isSaving && <CheckCircle2 size={16} />}
              </button>
            </div>
          </div>
        ) : (
          
          <div>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100 no-scrollbar flex-1">
                <TabButton active={activeTab === "Roommates"} onClick={() => setActiveTab("Roommates")} icon={<Home size={16} />} label="Roommates" />
                <TabButton active={activeTab === "Study partner"} onClick={() => setActiveTab("Study partner")} icon={<BookOpen size={16} />} label="Study Partners" />
                <TabButton active={activeTab === "Partner"} onClick={() => setActiveTab("Partner")} icon={<Heart size={16} />} label="Partners" />
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100 shrink-0">
                <Filter size={16} className="text-gray-400" />
                <select 
                  value={filterCampus} 
                  onChange={(e) => setFilterCampus(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer max-w-[200px] truncate"
                >
                  <option value="All">All Campuses</option>
                  {universities.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {finalMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-20 text-center">
                <AlertCircle size={40} className="mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-800">No {activeTab}s found</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  There are no matches for this filter yet. Try switching tabs or selecting "All Campuses".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {finalMatches.map((m) => (
                  <CampusMatchCard key={m.uid} profile={m} onReport={handleReport} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all ${
        active ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}