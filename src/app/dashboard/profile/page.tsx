"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { toast } from "sonner";
import {
  User,
  Mail,
  BadgeCheck,
  Trash2,
  Save,
  ArrowLeft,
  Home,
  AlertTriangle,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ProfilePage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setIsFetching(false);
      return;
    }

    const firestore = db;

    const fetchProfile = async () => {
      try {
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.name || user.displayName || "");
          setEmail(user.email || "");
          setRole(data.role || "student");
        } else {
          setDisplayName(user.displayName || "");
          setEmail(user.email || "");
        }
      } catch {
        setError("Failed to load profile data.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !db) return;

    if (!displayName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      const firestore = db;

      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        name: displayName,
      });

      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !db || !auth) return;

    const confirmed = window.confirm(
      "⚠️ Are you sure you want to permanently delete your account?\n\n" +
        "This will remove all your data (bookings, listings, profile) and cannot be undone."
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "This is your final warning. ALL your data will be lost. Click OK to proceed."
    );

    if (!doubleConfirmed) return;

    setIsDeleting(true);

    try {
      const firestore = db;

      await deleteDoc(doc(firestore, "users", user.uid));
      await deleteUser(user);

      toast.success("Account deleted successfully.");
      router.push("/");
    } catch (err: any) {
      console.error("Delete account failed:", err);

      if (err.code === "auth/requires-recent-login") {
        toast.error(
          "For security, please log out and log back in, then try deleting your account again."
        );
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading || isFetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <div className="animate-pulse text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gray-200" />
          <div className="mt-4 h-4 w-48 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-8">
      <div className="container-medium">

        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)]"
          >
            <Home size={18} />
            Home
          </Link>

          <span className="text-gray-300">/</span>

          <span className="text-sm text-gray-500">
            Profile
          </span>
        </div>

        <div className="card-premium overflow-hidden bg-[var(--nexora-navy)] p-6 text-white">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold">
              {initials || "U"}
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Profile & Settings
              </h1>

              <p className="text-sm text-gray-300">
                Manage your account information and preferences
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 card-premium bg-white p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-5">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Display Name
              </label>

              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border p-3"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email Address
              </label>

              <input
                value={email}
                disabled
                className="w-full rounded-lg border bg-gray-50 p-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Account Role
              </label>

              <input
                value={role}
                disabled
                className="w-full rounded-lg border bg-gray-50 p-3"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-white disabled:bg-gray-300"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>

          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            <h2 className="text-lg font-semibold text-red-600">
              Danger Zone
            </h2>
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="mt-4 flex items-center gap-2 rounded-full bg-red-600 px-6 py-2 text-white"
          >
            <Trash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

      </div>
    </main>
  );
}