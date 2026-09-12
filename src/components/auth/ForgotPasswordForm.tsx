// src/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, AlertCircle, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    if (!auth) {
      setError("Authentication service is unavailable. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      // Common Firebase error codes
      if (err?.code === "auth/user-not-found") {
        // Don't reveal if user exists — still show success for security
        setSent(true);
      } else if (err?.code === "auth/invalid-email") {
        setError("That doesn't look like a valid email address.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── SUCCESS STATE ───
  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-green-200 bg-green-50/60 p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--nexora-success)] text-white">
            <CheckCircle2 size={26} />
          </div>
          <p className="text-sm font-semibold text-[var(--nexora-navy)]">
            Check your inbox
          </p>
          <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
            We sent a password reset link to{" "}
            <span className="font-medium text-[var(--nexora-navy)]">{email}</span>
          </p>
          <p className="mt-3 text-[11px] text-gray-500">
            Didn&apos;t get it? Check your spam folder, or try again in a minute.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Send to a different email
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
        >
          Back to Log In
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck size={12} className="text-[var(--nexora-primary)]" />
          <span>Your reset link is secure and expires in 1 hour.</span>
        </div>
      </div>
    );
  }

  // ─── FORM STATE ───
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Account email
        </p>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail size={16} />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50"
            disabled={isSubmitting}
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Sending...
          </span>
        ) : (
          "Send Reset Link"
        )}
      </button>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-[var(--nexora-primary)]"
      >
        <ArrowLeft size={14} />
        Back to Log In
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck size={12} className="text-[var(--nexora-primary)]" />
        <span>Your reset link is secure and expires in 1 hour.</span>
      </div>
    </form>
  );
}