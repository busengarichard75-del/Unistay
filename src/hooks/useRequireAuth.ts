import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

type AllowedRole = "student" | "landlord" | "admin" | null;

export function useRequireAuth(requiredRole?: AllowedRole) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (requiredRole && role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (role === "landlord") {
          router.push("/dashboard/landlord");
        } else if (role === "student") {
          router.push("/dashboard/student");
        } else if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, role, isLoading, router, requiredRole]);

  return { user, role, isLoading };
}