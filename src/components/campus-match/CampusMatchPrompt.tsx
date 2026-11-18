// src/components/campus-match/CampusMatchPrompt.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, X, ArrowRight } from "lucide-react";
import { User } from "@/types/user";
import { getMyCampusProfile } from "@/services/campusMatchService";

interface CampusMatchPromptProps {
  user: User;
}

const DISMISS_KEY = "campusMatch_dismissedAt";
const COUNT_KEY = "campusMatch_dismissCount";
const MAX_DISMISSALS = 3;
const DAYS_TO_WAIT = 3;

export function CampusMatchPrompt({ user }: CampusMatchPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const dismissCount = Number(localStorage.getItem(COUNT_KEY) || 0);

      if (dismissCount >= MAX_DISMISSALS) {
        setIsChecking(false);
        return;
      }

      const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (dismissedAt > 0 && daysSinceDismiss < DAYS_TO_WAIT) {
        setIsChecking(false);
        return;
      }

      const profile = await getMyCampusProfile(user.uid);
      if (!profile) {
        setIsVisible(true);
      }
      setIsChecking(false);
    }

    if (user?.uid) {
      checkStatus();
    }
  }, [user]);

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    setIsVisible(false);
    
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    const currentCount = Number(localStorage.getItem(COUNT_KEY) || 0);
    localStorage.setItem(COUNT_KEY, (currentCount + 1).toString());
  }

  if (isChecking || !isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-5 text-white shadow-md transition-all hover:scale-[1.01]">
      <Users className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10" />

      <button 
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Users size={16} />
          </span>
          <h3 className="text-lg font-bold">Campus Match is here!</h3>
        </div>
        <p className="max-w-md text-sm text-indigo-100">
          Find the perfect roommate, study partner, or connection at {user.university}.
        </p>
        
        <Link
          href="/campus-match"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          Find My Match
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}