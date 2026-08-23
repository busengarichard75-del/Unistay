"use client";

import { useAuth } from "@/lib/AuthContext";

export function UserGreeting() {
  const { user, isLoading } = useAuth();

  // Don't show anything while loading or if no user
  if (isLoading || !user) return null;

  // Use fullName from the auth context (same as navbar)
  const displayName = user.fullName || user.email?.split("@")[0] || "User";

  return (
    <div className="mb-4 text-center">
      <p className="text-sm text-gray-600">
        Welcome back, <span className="font-semibold text-[var(--nexora-navy)]">{displayName}</span> 👋
      </p>
    </div>
  );
}