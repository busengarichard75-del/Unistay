import { ProviderSignupForm } from "@/components/provider/ProviderSignupForm";
import { PageTransition } from "@/components/PageTransition";
import { Store, ShieldCheck, BarChart3, MessageCircle } from "lucide-react";

export default function ProviderSignupPage() {
  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 px-4 py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
              <Store size={26} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Grow your business on Peza
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-indigo-200/90">
              Reach thousands of students across your campus. Free to join.
            </p>
          </div>

          <div className="w-full rounded-3xl bg-white p-6 shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10 sm:p-7">
            <ProviderSignupForm />
          </div>

          <div className="mt-6 grid w-full grid-cols-3 gap-2 sm:gap-3">
            <TrustBadge
              icon={<ShieldCheck size={14} />}
              label="Verified"
              hint="Admin reviewed"
            />
            <TrustBadge
              icon={<BarChart3 size={14} />}
              label="Analytics"
              hint="Views & clicks"
            />
            <TrustBadge
              icon={<MessageCircle size={14} />}
              label="WhatsApp"
              hint="Direct contact"
            />
          </div>

          <p className="mt-6 text-center text-[11px] text-indigo-300/70">
            Peza only connects you with students — we don&apos;t handle payments.
          </p>
        </div>
      </main>
    </PageTransition>
  );
}

function TrustBadge({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-2 py-2.5 text-center backdrop-blur-sm ring-1 ring-white/10">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-emerald-300">
        {icon}
      </span>
      <p className="text-[11px] font-semibold text-white">{label}</p>
      <p className="text-[9px] text-indigo-300/70">{hint}</p>
    </div>
  );
}