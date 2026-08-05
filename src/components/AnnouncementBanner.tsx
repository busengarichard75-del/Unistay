"use client";

import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { getAnnouncement, Announcement } from "@/services/announcementService";

const STORAGE_KEY = "unistay_announcement_dismissed";

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await getAnnouncement();
      if (data && data.isActive) {
        setAnnouncement(data);
        // Check localStorage – if stored timestamp matches updatedAt, hide it
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed && Number(dismissed) === data.updatedAt) {
          setIsDismissed(true);
        } else {
          setIsDismissed(false);
        }
      } else {
        setAnnouncement(null);
      }
    };
    fetch();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem(STORAGE_KEY, String(announcement.updatedAt));
      setIsDismissed(true);
    }
  };

  if (!announcement || !announcement.isActive || isDismissed) {
    return null;
  }

  return (
    <div className="container-wide mt-4">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 text-sm text-[var(--nexora-navy)] shadow-sm">
        <div className="flex items-center gap-3">
          <Megaphone size={18} className="text-[var(--nexora-primary)] shrink-0" />
          <span className="break-words">{announcement.content}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}