"use client";

import { useAuth } from "@/lib/AuthContext";

export function UserGreeting() {
  const { user, isLoading } = useAuth();

  const showGreeting = !isLoading && user;

  // Use fullName from the auth context (same as navbar)
  const displayName = user
    ? user.fullName || user.email?.split("@")[0] || "User"
    : "";

  // The wrapper always takes the same height, so the page doesn't jump
  // when the greeting appears after auth finishes loading.
  return (
    <div className="mb-2 h-5 text-center">
      {showGreeting && (
        <p className="text-sm leading-5 text-gray-600">
          Welcome back,{" "}
          <span className="font-semibold text-[var(--nexora-navy)]">
            {displayName}
          </span>{" "}
          👋
        </p>
      )}
    </div>
  );
}