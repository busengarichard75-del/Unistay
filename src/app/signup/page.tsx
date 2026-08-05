import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Create your UniStay account
      </h1>
      <SignupForm />
    </main>
  );
}