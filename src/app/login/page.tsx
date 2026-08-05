import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Log in to UniStay
      </h1>
      <LoginForm />
    </main>
  );
}