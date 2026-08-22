import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

type AllowedRole = "student" | "landlord" | "admin" | null;

export function useRequireAuth(requiredRole?: AllowedRole) {
  const { user, isLoading } = useAuth(); // ✅ Removed `role` from destructuring
  const router = useRouter();

  // ✅ Use user.role directly
  const effectiveRole = user?.role || null;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (requiredRole && effectiveRole !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (effectiveRole === "landlord") {
          router.push("/dashboard/landlord");
        } else if (effectiveRole === "student") {
          router.push("/dashboard/student");
        } else if (effectiveRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, effectiveRole, isLoading, router, requiredRole]);

  return { user, role: effectiveRole, isLoading };
}