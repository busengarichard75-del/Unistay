"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setIsSubmitting(true);

    if (!auth) {
      setError("Authentication service is unavailable. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ─── Error banner ─── */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* ─── Account fields ─── */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Your account
        </p>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail size={16} />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={16} />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
            disabled={isSubmitting}
            autoComplete="current-password"
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

        {/* ─── Forgot password link ─── */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-xs font-medium text-[var(--nexora-primary)] transition-colors hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {/* ─── Submit ─── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Logging in...
          </span>
        ) : (
          "Log In"
        )}
      </button>

      {/* ─── Trust footer ─── */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck size={12} className="text-[var(--nexora-primary)]" />
        <span>Your data is safe. We never share your details.</span>
      </div>

      <p className="text-center text-xs text-gray-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="font-medium text-blue-600 hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}