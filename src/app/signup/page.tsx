import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";
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

          {/* ─── Service Provider CTA (bold gradient, prominent) ─── */}
          <Link
            href="/signup/provider"
            className="peza-provider-cta group mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/35 active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm backdrop-blur-sm">
              <Store size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">
                Offering a service or selling?
              </p>
              <p className="mt-0.5 text-xs text-white/90">
                Sign up as a Service Provider
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 text-white transition-transform group-hover:translate-x-1"
            />
          </Link>

          <SignupForm />
        </div>
      </main>

      {/* ─── Subtle glow pulse for the CTA ─── */}
      <style>{`
        @keyframes peza-provider-cta-glow {
          0%, 100% {
            box-shadow:
              0 10px 22px -8px rgba(99, 102, 241, 0.4),
              0 0 0 0 rgba(139, 92, 246, 0.5);
          }
          50% {
            box-shadow:
              0 10px 26px -8px rgba(99, 102, 241, 0.5),
              0 0 0 14px rgba(139, 92, 246, 0);
          }
        }
        .peza-provider-cta {
          animation: peza-provider-cta-glow 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .peza-provider-cta { animation: none; }
        }
      `}</style>
    </PageTransition>
  );
}