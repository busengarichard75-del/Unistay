// src/app/guides/page.tsx

import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { GUIDES } from "@/data/guides";
import { BookOpen, ArrowRight, Clock } from "lucide-react";

export const metadata = {
  title: "Student Guides & Tips | Peza",
  description: "Expert guides on finding student accommodation, studying, and living your best life at university in Zambia.",
};

export default function GuidesPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium flex-1 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--nexora-navy)] sm:text-4xl">
            Peza Student Guides
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 sm:text-base">
            Everything you need to know about finding accommodation, understanding prices, and surviving campus life in Zambia.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="p-6">
                <div className="mb-3 flex items-center gap-3 text-[11px] font-medium text-gray-400">
                  <span>{guide.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {guide.readTime}
                  </span>
                </div>
                <h2 className="text-lg font-bold leading-tight text-[var(--nexora-navy)] transition-colors group-hover:text-[var(--nexora-primary)]">
                  {guide.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500">
                  {guide.excerpt}
                </p>
              </div>
              <div className="border-t border-gray-50 bg-gray-50/50 px-6 py-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--nexora-primary)]">
                  Read guide <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}