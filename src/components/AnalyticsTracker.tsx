// src/components/AnalyticsTracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { logVisit, VisitorRole } from "@/services/analyticsService";

const ADMIN_EMAILS = ["admin@unistay.com", "busengarichard75@gmail.com"];

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!pathname) return;

    // Don't track admin activity — would inflate numbers
    if (user?.email && ADMIN_EMAILS.includes(user.email)) return;

    // Don't track admin routes
    if (pathname.startsWith("/admin")) return;

    // Dedup — same path within 5 seconds (StrictMode / rapid nav guard)
    const dedupKey = "peza_analytics_last";
    const newKey = `${pathname}_${Math.floor(Date.now() / 5000)}`;
    if (typeof window !== "undefined") {
      const last = sessionStorage.getItem(dedupKey);
      if (last === newKey) return;
      sessionStorage.setItem(dedupKey, newKey);
    }

    const role: VisitorRole = user?.role === "student" || user?.role === "landlord"
      ? user.role
      : "guest";

    logVisit({
      userId: user?.uid || null,
      role,
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  }, [pathname, user]);

  return null;
}