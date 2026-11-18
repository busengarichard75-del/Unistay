"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  reload as reloadFirebaseUser,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
      if (!firebaseUser.emailVerified) {
        await reloadFirebaseUser(firebaseUser);
      }

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
          emailVerified: firebaseUser.emailVerified,
          studentNumber: data.studentNumber,
          university: data.university,
          preferences: data.preferences,
          whatsapp: data.whatsapp,
          businessName: data.businessName,
          providerType: data.providerType,
          photoURL: data.photoURL || undefined,
          shopSettings: data.shopSettings || undefined,
          verificationStatus: data.verificationStatus,
          verificationReviewedAt: data.verificationReviewedAt,
          verificationReviewedBy: data.verificationReviewedBy,
          verificationReason: data.verificationReason,
          // ⭐ THE MISSING FIELDS — these were never being read back
          plan: data.plan,
          planExpiry: data.planExpiry,
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
    await reloadFirebaseUser(auth.currentUser);
    const profile = await fetchUserProfile(auth.currentUser);
    setUser(profile);
  };

  // ─── Initial auth state + profile fetch ───
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

  // ─── Live listener for plan / verification changes ───
  // This is what makes admin upgrades show up instantly without refresh.
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setUser((prev) =>
          prev
            ? {
                ...prev,
                plan: data.plan,
                planExpiry: data.planExpiry,
                verificationStatus: data.verificationStatus,
                verificationReason: data.verificationReason,
                businessName: data.businessName,
                providerType: data.providerType,
                phone: data.phone,
                whatsapp: data.whatsapp,
                photoURL: data.photoURL || undefined,
                shopSettings: data.shopSettings || undefined,
              }
            : prev
        );
      },
      (err) => {
        console.warn("User live listener failed (non-critical):", err);
      }
    );

    return () => unsub();
  }, [user?.uid]);

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