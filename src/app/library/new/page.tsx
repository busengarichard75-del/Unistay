"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BackButton } from "@/components/ui/BackButton";
import { UploadForm } from "@/components/library/UploadForm";
import { BookOpen } from "lucide-react";

export default function NewLibraryEntryPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-narrow py-6">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Share a material</h1>
              <p className="text-xs text-white/85 sm:text-sm">
                Help other students — no file uploads, just paste a Google Drive link
              </p>
            </div>
          </div>
        </div>

        <UploadForm />
      </div>

      <Footer />
    </main>
  );
}