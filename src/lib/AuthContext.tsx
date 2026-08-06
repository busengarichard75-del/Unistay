"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Role = "student" | "landlord";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setIsLoading(false);
      return;
    }

    const firebaseAuth = auth;
    const firestore = db;

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        console.log(
          "Auth state changed. User:",
          currentUser?.email ?? "none"
        );

        setUser(currentUser);

        if (currentUser) {
          const snapshot = await getDoc(
            doc(firestore, "users", currentUser.uid)
          );

          const fetchedRole = snapshot.data()?.role;

          console.log(
            "Fetched role from Firestore:",
            fetchedRole
          );

          setRole((fetchedRole as Role) ?? null);
        } else {
          setRole(null);
        }

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}