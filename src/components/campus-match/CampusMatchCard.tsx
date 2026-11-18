// src/components/campus-match/CampusMatchCard.tsx
"use client";

import { MessageCircle, Flag, GraduationCap, Moon, Sparkles, Volume2, Users, Heart, MapPin } from "lucide-react";
import { CampusMatchProfile } from "@/types/campusMatch";
import { getUniversityFullName } from "@/lib/universityLabels"; // Assuming you have this helper

interface CampusMatchCardProps {
  profile: CampusMatchProfile;
  onReport: (uid: string, name: string) => void;
}

export function CampusMatchCard({ profile, onReport }: CampusMatchCardProps) {
  const cleanPhone = profile.whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Hi ${profile.firstName}! I found your profile on Peza Campus Match. I'm also at ${profile.university} and looking for a ${profile.lookingFor.toLowerCase()}. Want to chat?`
  );
  const waLink = `https://wa.me/${cleanPhone}?text=${text}`;

  const initial = profile.firstName.charAt(0).toUpperCase();

  const getLookingForIcon = () => {
    if (profile.lookingFor === "Partner") return <Heart size={12} />;
    if (profile.lookingFor === "Roommate") return <Users size={12} />;
    return <Sparkles size={12} />;
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      
      {/* Top Section with Photo */}
      <div className="relative flex items-center gap-4 p-5 pb-4 border-b border-gray-50">
        {profile.photoUrl ? (
          <img 
            src={profile.photoUrl} 
            alt={profile.firstName} 
            className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-xl font-bold text-indigo-700 shadow-sm">
            {initial}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg truncate">
            {profile.firstName}
          </h3>
          <p className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
            <GraduationCap size={12} />
            {profile.yearOfStudy} {profile.course ? `· ${profile.course}` : ""}
          </p>
          <p className="flex items-center gap-1 text-xs text-indigo-600 font-medium truncate mt-0.5">
            <MapPin size={12} />
            {getUniversityFullName(profile.university) || profile.university}
          </p>
        </div>

        <button
          onClick={() => onReport(profile.uid, profile.firstName)}
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Report this profile"
        >
          <Flag size={14} />
        </button>
      </div>

      <div className="p-5 pt-4 flex-1 flex flex-col">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            profile.lookingFor === "Partner" ? "bg-pink-50 text-pink-700 border-pink-100" :
            profile.lookingFor === "Roommate" ? "bg-blue-50 text-blue-700 border-blue-100" :
            "bg-indigo-50 text-indigo-700 border-indigo-100"
          }`}>
            {getLookingForIcon()}
            Looking for: {profile.lookingFor}
          </span>
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-3 italic">
            "{profile.bio}"
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5 mb-5">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 border border-gray-200">
            <Moon size={10} />
            {profile.sleepSchedule}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 border border-gray-200">
            <Sparkles size={10} />
            {profile.cleanliness}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 border border-gray-200">
            <Volume2 size={10} />
            {profile.noiseTolerance}
          </span>
        </div>

        <div className="mt-auto pt-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            <MessageCircle size={16} fill="currentColor" />
            Message on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}