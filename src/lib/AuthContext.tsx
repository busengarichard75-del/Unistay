"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  reload as reloadFirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types/user";

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      // ✅ Reload Firebase user to get latest emailVerified status
      await reloadFirebaseUser(firebaseUser);

      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: firebaseUser.uid,
          fullName: data.fullName || firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          phone: data.phone || "",
          role: data.role || "student",
          createdAt: data.createdAt || Date.now(),
          hasAcceptedTerms: data.hasAcceptedTerms || false,
          emailVerified: firebaseUser.emailVerified, // ✅ New field
          studentNumber: data.studentNumber,
          university: data.university,
          preferences: data.preferences,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (!auth.currentUser) {
      setUser(null);
      return;
    }
    // ✅ Reload Firebase user to refresh emailVerified
    await reloadFirebaseUser(auth.currentUser);
    const profile = await fetchUserProfile(auth.currentUser);
    setUser(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);