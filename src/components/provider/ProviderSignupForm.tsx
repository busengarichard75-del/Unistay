"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  School,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Wrench,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { universities } from "@/data/universities";
import { useAuth } from "@/lib/AuthContext";

type ProviderType = "service" | "product";

export function ProviderSignupForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [password, setPassword] = useState("");
  const [providerType, setProviderType] = useState<ProviderType>("service");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() || !whatsapp.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!university) {
      toast.error("Please select your university or area.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = cred.user;

      await updateProfile(fbUser, { displayName: fullName });

      await setDoc(doc(db, "users", fbUser.uid), {
        fullName: fullName.trim(),
        email,
        phone: whatsapp.trim(),
        whatsapp: whatsapp.trim(),
        university,
        role: "service_provider",
        providerType,
        createdAt: Date.now(),
        hasAcceptedTerms: true,
        acceptedTermsAt: Date.now(),
        verificationStatus: "pending",
      });

      if (refreshUser) await refreshUser();

      toast.success("Welcome to Peza! 🎉 Your account is under review.");
      router.push("/dashboard/provider");
    } catch (error: any) {
      console.error("Provider signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Try logging in instead.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("That email doesn't look right.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Only pulse when the form is ready to submit
  const canPulse = !isLoading && acceptedTerms;

  return (
    <>
      {/* ─── Glow keyframes for the submit button ─── */}
      <style>{`
        @keyframes peza-provider-glow {
          0%, 100% {
            box-shadow:
              0 8px 20px -6px rgba(99, 102, 241, 0.5),
              0 0 0 0 rgba(139, 92, 246, 0.55);
          }
          50% {
            box-shadow:
              0 8px 24px -6px rgba(99, 102, 241, 0.65),
              0 0 0 14px rgba(139, 92, 246, 0);
          }
        }
        .peza-provider-glow {
          animation: peza-provider-glow 2.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .peza-provider-glow { animation: none; }
        }
      `}</style>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Provider type ─── */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            I mainly want to
          </p>
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              active={providerType === "service"}
              onClick={() => setProviderType("service")}
              icon={<Wrench size={20} />}
              title="Offer a Service"
              subtitle="Barber, printing, repairs…"
            />
            <TypeCard
              active={providerType === "product"}
              onClick={() => setProviderType("product")}
              icon={<ShoppingBag size={20} />}
              title="Sell Products"
              subtitle="Phones, books, food…"
            />
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            You can create both later — this just sets your default view.
          </p>
        </div>

        {/* ─── Details ─── */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Your details
          </p>

          <Field
            icon={<UserIcon size={16} />}
            type="text"
            value={fullName}
            onChange={setFullName}
            placeholder="Full name / Business name"
            disabled={isLoading}
          />

          <Field
            icon={<Phone size={16} />}
            type="tel"
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="WhatsApp number (e.g., 097 123 4567)"
            disabled={isLoading}
          />

          <Field
            icon={<Mail size={16} />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Email Address"
            disabled={isLoading}
          />
        </div>

        {/* ─── University / area ─── */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Primary area
          </p>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <School size={16} />
            </span>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              disabled={isLoading}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 disabled:bg-gray-50"
            >
              <option value="">Select your university or area</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                  {u.name}
                  {!u.isAvailable ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              ▾
            </span>
          </div>
        </div>

        {/* ─── Security ─── */}
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
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 disabled:bg-gray-50"
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

        {/* ─── Terms ─── */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
            acceptedTerms
              ? "border-indigo-500 bg-indigo-50/60"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={isLoading}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-xs leading-relaxed text-gray-600">
            I agree to Peza&apos;s{" "}
            <a
              href="/legal"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-indigo-600 underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/legal#privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-indigo-600 underline"
            >
              Privacy Policy
            </a>
            . I understand Peza only connects me with students and does not handle
            payments.
          </span>
        </label>

        {/* ─── Submit (with pulse glow) ─── */}
        <button
          type="submit"
          disabled={isLoading || !acceptedTerms}
          className={`relative w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
            canPulse ? "peza-provider-glow" : ""
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account...
            </span>
          ) : (
            "Create Provider Account"
          )}
        </button>

        {/* ─── Trust footer ─── */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck size={12} className="text-indigo-500" />
          <span>Your data is safe. We never share your details.</span>
        </div>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-indigo-600 hover:underline"
          >
            Log In
          </button>
        </p>
      </form>
    </>
  );
}

/* ──────────────────────────────────────────────── */
/* Sub-components                                  */
/* ──────────────────────────────────────────────── */

function TypeCard({
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
          ? "border-indigo-500 bg-indigo-50/60 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      {active && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </span>
      <p
        className={`mt-2.5 text-sm font-semibold transition-colors ${
          active ? "text-indigo-900" : "text-gray-700"
        }`}
      >
        {title}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
    </button>
  );
}

function Field({
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
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 disabled:bg-gray-50"
      />
    </div>
  );
}