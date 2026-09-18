"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { BackButton } from "@/components/ui/BackButton";
import { universities } from "@/data/universities";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  School,
  Lock,
  LogOut,
  Trash2,
  Save,
  Shield,
  AlertTriangle,
  X,
  Check,
  IdCard,
} from "lucide-react";

const ADMIN_EMAILS = ["admin@unistay.com", "busengarichard75@gmail.com"];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, refreshUser, signOut: contextSignOut } = useAuth();

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [original, setOriginal] = useState({
    fullName: "",
    phone: "",
    university: "",
    studentNumber: "",
    businessName: "",
    whatsapp: "",
  });

  // ─── Fetch user doc ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists() || !active) return;
        const data = snap.data();
        const initial = {
          fullName: data?.fullName || "",
          phone: data?.phone || "",
          university: data?.university || "",
          studentNumber: data?.studentNumber || "",
          businessName: data?.businessName || "",
          whatsapp: data?.whatsapp || "",
        };
        setFullName(initial.fullName);
        setPhone(initial.phone);
        setUniversity(initial.university);
        setStudentNumber(initial.studentNumber);
        setBusinessName(initial.businessName);
        setWhatsapp(initial.whatsapp);
        setOriginal(initial);
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const isStudent = user?.role === "student";
  const isLandlord = user?.role === "landlord";
  const isProvider = user?.role === "service_provider";
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  const hasChanges =
    fullName.trim() !== original.fullName ||
    phone.trim() !== original.phone ||
    university !== original.university ||
    studentNumber.trim() !== original.studentNumber ||
    businessName.trim() !== original.businessName ||
    whatsapp.trim() !== original.whatsapp;

  // ─── Save profile ───────────────────────────────────────────
  async function handleSave() {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (isStudent && !university) {
      toast.error("Please select your university.");
      return;
    }
    if (isProvider && !whatsapp.trim()) {
      toast.error("Please enter your WhatsApp number.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
      };
      if (university) payload.university = university;
      if (isStudent && studentNumber.trim()) {
        payload.studentNumber = studentNumber.trim();
      }
      if (isProvider) {
        if (businessName.trim()) payload.businessName = businessName.trim();
        if (whatsapp.trim()) payload.whatsapp = whatsapp.trim();
      }

      await updateDoc(doc(db, "users", user.uid), payload);
      if (refreshUser) await refreshUser();
      setOriginal({
        fullName: fullName.trim(),
        phone: phone.trim(),
        university,
        studentNumber: studentNumber.trim(),
        businessName: businessName.trim(),
        whatsapp: whatsapp.trim(),
      });
      toast.success("Profile updated!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Change password ────────────────────────────────────────
  async function handleChangePassword() {
    if (!user?.email) return;
    if (!window.confirm(`Send a password reset link to ${user.email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset link sent to your email.");
    } catch {
      toast.error("Failed to send reset link. Please try again.");
    }
  }

  // ─── Sign out ───────────────────────────────────────────────
  async function handleSignOut() {
    if (!window.confirm("Log out of Peza?")) return;
    try {
      if (contextSignOut) await contextSignOut();
      else await signOut(auth);
      toast.success("Logged out.");
      router.push("/");
    } catch {
      toast.error("Logout failed.");
    }
  }

  // ─── Delete account ─────────────────────────────────────────
  async function handleDeleteAccount() {
    if (!user) return;
    if (deleteConfirmText !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Delete Firestore user doc
      await deleteDoc(doc(db, "users", user.uid));

      // 2. Delete Firebase Auth user
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      toast.success("Account deleted. Goodbye 👋");
      router.push("/");
    } catch (err: any) {
      console.error("Delete failed:", err);
      if (err?.code === "auth/requires-recent-login") {
        toast.error(
          "For security, please log out and log back in, then try deleting again."
        );
      } else {
        toast.error("Failed to delete account. Contact support.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Loading / not signed in ────────────────────────────────
  if (isLoading || isFetching || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const initials = (fullName || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    user.role === "student"
      ? "Student"
      : user.role === "landlord"
      ? "Landlord"
      : user.role === "service_provider"
      ? "Service Provider"
      : "User";

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50";

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-narrow">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* Header */}
        <div className="card-premium bg-[var(--nexora-navy)] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-primary)] text-lg font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">
                {fullName || "Your Profile"}
              </h1>
              <p className="truncate text-xs text-gray-300">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold capitalize">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Account details */}
        <section className="mt-6 card-premium p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--nexora-navy)]">
            <UserIcon size={16} /> Account details
          </h2>

          <div className="space-y-4">
            <Field label="Full Name" icon={<UserIcon size={16} />}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name as on NRC"
                disabled={isSaving}
                className={inputClass}
              />
            </Field>

            <Field label="Email" icon={<Mail size={16} />}>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className={`${inputClass} bg-gray-50`}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Email can&apos;t be changed. Contact support if needed.
              </p>
            </Field>

            <Field label="Phone Number" icon={<Phone size={16} />}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+260 97 123 4567"
                disabled={isSaving}
                className={inputClass}
              />
            </Field>

            {isStudent && (
              <>
                <Field label="University" icon={<School size={16} />}>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    disabled={isSaving}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select your university</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                        {u.name}
                        {!u.isAvailable ? " (coming soon)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Student ID" icon={<IdCard size={16} />}>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="e.g., 2023123456"
                    disabled={isSaving}
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {(isProvider || isLandlord) && (
              <>
                <Field label="University / Primary Area" icon={<School size={16} />}>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    disabled={isSaving}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select your university</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                        {u.name}
                        {!u.isAvailable ? " (coming soon)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                {isProvider && (
                  <>
                    <Field label="Business Name (optional)" icon={<UserIcon size={16} />}>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g., Fresh Fade Barber"
                        disabled={isSaving}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="WhatsApp Number" icon={<Phone size={16} />}>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+260 97 123 4567"
                        disabled={isSaving}
                        className={inputClass}
                      />
                      <p className="mt-1 text-[11px] text-gray-400">
                        Used for student contact. Never shown publicly.
                      </p>
                    </Field>
                  </>
                )}
              </>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--nexora-primary)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save size={16} />
                  {hasChanges ? "Save Changes" : "No changes to save"}
                </>
              )}
            </button>
          </div>
        </section>

        {/* Security */}
        <section className="mt-4 card-premium p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--nexora-navy)]">
            <Shield size={16} /> Security
          </h2>

          <button
            onClick={handleChangePassword}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-left transition-colors hover:border-[var(--nexora-primary)]/40 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                <Lock size={14} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--nexora-navy)]">
                  Change password
                </p>
                <p className="text-xs text-gray-500">
                  We&apos;ll email you a reset link
                </p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </section>

        {/* Sign out */}
        <section className="mt-4 card-premium p-6">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </section>

        {/* Danger zone */}
        {!isAdmin && (
          <section className="mt-4 rounded-2xl border border-red-200 bg-red-50/40 p-6">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle size={16} /> Danger Zone
            </h2>
            <p className="mb-4 text-xs text-red-800/80 leading-relaxed">
              Deleting your account is permanent. All your bookings, listings, and
              data will be removed. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete My Account
            </button>
          </section>
        )}
      </div>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-3 py-3 sm:items-center sm:px-4"
          onClick={() => {
            if (isDeleting) return;
            setShowDeleteModal(false);
            setDeleteConfirmText("");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Delete your account?
                  </h3>
                  <p className="text-xs text-gray-500">
                    This action is permanent
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isDeleting) return;
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-800 leading-relaxed">
                  <strong>You will lose:</strong> your bookings, listings, and
                  account access. Peza cannot recover this.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-mono text-gray-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:bg-gray-50"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Deleting...
                    </span>
                  ) : (
                    <>
                      <Trash2 size={14} className="inline mr-1" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ──────────────────────────────────────────────── */
/* Field wrapper                                   */
/* ──────────────────────────────────────────────── */

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}