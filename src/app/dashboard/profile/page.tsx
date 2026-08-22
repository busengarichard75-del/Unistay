"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { toast } from "sonner";
import { User, Mail, BadgeCheck, Trash2, Save, ArrowLeft, Home, AlertTriangle, Phone, IdCard } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ProfilePage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(data.fullName || user.fullName || "");
          setEmail(user.email || "");
          setRole(data.role || "student");
          setPhone(data.phone || "");
          setStudentNumber(data.studentNumber || "");
        } else {
          setFullName(user.fullName || "");
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
    if (!user) return;
    if (!fullName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData: any = {
        fullName: fullName,
        phone,
      };
      if (role === "student") {
        updateData.studentNumber = studentNumber;
      }
      await updateDoc(userRef, updateData);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

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
      // ✅ Use auth.currentUser directly
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        toast.error("You are not logged in.");
        return;
      }

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(firebaseUser);
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

  const initials = fullName
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
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)] transition-colors"
          >
            <Home size={18} />
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Profile</span>
        </div>

        {/* Header Card */}
        <div className="card-premium overflow-hidden bg-[var(--nexora-navy)] p-6 text-white">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white shadow-lg ring-2 ring-white/20">
              {initials || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Profile & Settings</h1>
              <p className="text-sm text-gray-300">Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Profile Form */}
        <div className="mt-6 card-premium bg-white p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--nexora-text-secondary)]">
                Full Name (as on NRC)
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--nexora-text-secondary)]">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
                  placeholder="e.g., +260 97 123 4567"
                />
              </div>
            </div>

            {/* Student ID – only for students */}
            {role === "student" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--nexora-text-secondary)]">
                  Student ID
                </label>
                <div className="relative">
                  <IdCard
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
                    placeholder="e.g., 2023123456"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--nexora-text-secondary)]">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed here.</p>
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--nexora-text-secondary)]">
                Account Role
              </label>
              <div className="relative">
                <BadgeCheck
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={role.charAt(0).toUpperCase() + role.slice(1)}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500 capitalize cursor-not-allowed"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--nexora-primary)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-50 p-2 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--nexora-text-secondary)]">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="mt-4 flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexora-text-secondary)] hover:text-[var(--nexora-navy)] transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}