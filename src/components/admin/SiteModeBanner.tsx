// src/components/admin/SiteModeBanner.tsx
"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function SiteModeBanner() {
  const pathname = usePathname();
  const [mode, setMode] = useState<"off" | "readonly">("off");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "main"),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setMode(data.siteMode === "readonly" ? "readonly" : "off");
        setMessage(data.siteModeMessage || "");
      },
      () => {
        // silent
      }
    );
    return () => unsub();
  }, []);

  if (mode !== "readonly") return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-amber-950 shadow-md">
      <AlertTriangle size={14} />
      <span>
        {message || "Peza is currently in maintenance mode — booking is paused."}
      </span>
    </div>
  );
}