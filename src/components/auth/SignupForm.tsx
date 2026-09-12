"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  IdCard,
  School,
  GraduationCap,
  Home,
  Check,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { universities } from "@/data/universities";

export default function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "landlord">("student");
  const [university, setUniversity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!university) {
      toast.error(
        role === "student"
          ? "Please select your university."
          : "Please select the university your listings are near."
      );
      return;
    }

    if (role === "student" && !studentNumber.trim()) {
      toast.error("Please enter your Student ID.");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      const userData: any = {
        fullName,
        email,
        phone,
        role,
        university,
        createdAt: Date.now(),
        hasAcceptedTerms: true,
        acceptedTermsAt: Date.now(),
      };

      if (role === "student") {
        userData.studentNumber = studentNumber.trim();
      }

      await setDoc(doc(db, "users", user.uid), userData);

      toast.success("Account created successfully!");
      router.push(role === "landlord" ? "/dashboard/landlord" : "/");
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Role selector ─── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          I am joining as
        </p>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            active={role === "student"}
            onClick={() => setRole("student")}
            icon={<GraduationCap size={20} />}
            title="Student"
            subtitle="Looking for a room"
          />
          <RoleCard
            active={role === "landlord"}
            onClick={() => setRole("landlord")}
            icon={<Home size={20} />}
            title="Landlord"
            subtitle="Listing a property"
          />
        </div>
      </div>

      {/* ─── Account details ─── */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Your details
        </p>

        <PremiumField
          icon={<User size={16} />}
          type="text"
          value={fullName}
          onChange={setFullName}
          placeholder="Full Name (as on NRC)"
          disabled={isLoading}
        />

        <PremiumField
          icon={<Mail size={16} />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Email Address"
          disabled={isLoading}
        />

        <PremiumField
          icon={<Phone size={16} />}
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="Phone Number (e.g., +260 97 123 4567)"
          disabled={isLoading}
        />
      </div>

      {/* ─── University & student info ─── */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {role === "student" ? "Campus" : "Location"}
        </p>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <School size={16} />
          </span>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition-all focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
            disabled={isLoading}
          >
            <option value="">
              {role === "student"
                ? "Select your university"
                : "Nearest university to your listings"}
            </option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>

        {role === "student" && (
          <PremiumField
            icon={<IdCard size={16} />}
            type="text"
            value={studentNumber}
            onChange={setStudentNumber}
            placeholder="Student ID (e.g., 2023123456)"
            disabled={isLoading}
          />
        )}
      </div>

      {/* ─── Password ─── */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Security
        </p>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={16} />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 6 characters)"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* ─── Terms & Privacy ─── */}
      <label
        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
          acceptedTerms
            ? "border-[var(--nexora-primary)] bg-blue-50/50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          disabled={isLoading}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--nexora-primary)] focus:ring-[var(--nexora-primary)]"
        />
        <span className="text-xs leading-relaxed text-gray-600">
          I agree to Peza's{" "}
          <a
            href="/legal"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[var(--nexora-primary)] underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/legal#privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[var(--nexora-primary)] underline"
          >
            Privacy Policy
          </a>
          . I understand Peza only connects me to verified landlords and does not
          handle rent payments.
        </span>
      </label>

      {/* ─── Submit ─── */}
      <button
        type="submit"
        disabled={isLoading || !acceptedTerms}
        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Creating account...
          </span>
        ) : (
          "Create My Account"
        )}
      </button>

      {/* ─── Trust footer ─── */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck size={12} className="text-[var(--nexora-primary)]" />
        <span>Your data is safe. We never share your details.</span>
      </div>

      <p className="text-center text-xs text-gray-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-medium text-blue-600 hover:underline"
        >
          Log In
        </button>
      </p>
    </form>
  );
}

/* ──────────────────────────────────────────────── */
/* Sub-components                                  */
/* ──────────────────────────────────────────────── */

function RoleCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
        active
          ? "border-[var(--nexora-primary)] bg-blue-50/50 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      {active && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--nexora-primary)]">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          active
            ? "bg-[var(--nexora-primary)] text-white"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </span>
      <p
        className={`mt-2.5 text-sm font-semibold transition-colors ${
          active ? "text-[var(--nexora-navy)]" : "text-gray-700"
        }`}
      >
        {title}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
    </button>
  );
}

function PremiumField({
  icon,
  type,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
        disabled={disabled}
      />
    </div>
  );
}