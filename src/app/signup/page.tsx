import SignupForm from "@/components/auth/SignupForm";
import { PageTransition } from "@/components/PageTransition";

export default function SignupPage() {
  return (
    <PageTransition>
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)] px-4">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-bold text-[var(--nexora-text-primary)] text-center">
            Create your Peza account
          </h1>
          <SignupForm />
        </div>
      </main>
    </PageTransition>
  );
}