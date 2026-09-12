// src/app/forgot-password/page.tsx
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PageTransition } from "@/components/PageTransition";

export default function ForgotPasswordPage() {
  return (
    <PageTransition>
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)] px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="mb-2 text-center text-2xl font-bold text-[var(--nexora-text-primary)]">
            Reset your password
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            We&apos;ll send a secure reset link to your email
          </p>
          <ForgotPasswordForm />
        </div>
      </main>
    </PageTransition>
  );
}