import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import SignupForm from "@/components/auth/SignupForm";
import { PageTransition } from "@/components/PageTransition";

export default function SignupPage() {
  return (
    <PageTransition>
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)] px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-[var(--nexora-text-primary)]">
            Create your Peza account
          </h1>

          {/* ─── Service Provider CTA (top, prominent) ─── */}
          <Link
            href="/signup/provider"
            className="group mb-6 flex items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--nexora-primary)]/40 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-all hover:border-[var(--nexora-primary)] hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--nexora-primary)] to-indigo-600 text-white shadow-sm">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--nexora-navy)]">
                Offering a service or selling?
              </p>
              <p className="mt-0.5 text-xs text-gray-600">
                Sign up as a Service Provider →
              </p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-[var(--nexora-primary)] transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          <SignupForm />
        </div>
      </main>
    </PageTransition>
  );
}