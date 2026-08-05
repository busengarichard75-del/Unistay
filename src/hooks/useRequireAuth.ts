"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

type Role = "student" | "landlord";

export function useRequireAuth(requiredRole?: Role) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (requiredRole && role !== requiredRole) {
      router.push("/");
    }
  }, [isLoading, user, role, requiredRole, router]);

  return { user, role, isLoading };
}