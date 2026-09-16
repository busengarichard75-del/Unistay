import { ProviderSignupForm } from "@/components/provider/ProviderSignupForm";
import { PageTransition } from "@/components/PageTransition";

export default function ProviderSignupPage() {
  return (
    <PageTransition>
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)] px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="mb-2 text-center text-2xl font-bold text-[var(--nexora-text-primary)]">
            Become a Peza Provider
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            Offer your services or sell products to students
          </p>
          <ProviderSignupForm />
        </div>
      </main>
    </PageTransition>
  );
}