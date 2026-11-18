import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

type AllowedRole = "student" | "landlord" | "service_provider" | null;

export function useRequireAuth(requiredRole?: AllowedRole) {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const effectiveRole = user?.role || null;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (requiredRole && effectiveRole !== requiredRole) {
        if (effectiveRole === "landlord") {
          router.push("/dashboard/landlord");
        } else if (effectiveRole === "student") {
          router.push("/dashboard/student");
        } else if (effectiveRole === "service_provider") {
          router.push("/dashboard/provider");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, effectiveRole, isLoading, router, requiredRole]);

  return { user, role: effectiveRole, isLoading, refreshUser };
}