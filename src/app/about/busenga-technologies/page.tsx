// src/app/about/busenga-technologies/page.tsx
import { Building2, ShieldCheck, MapPin, Globe, Calendar, Hash } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Busenga Technologies | Operator of Peza ZM",
  description: "Learn about Busenga Technologies, a registered business in Zambia and the official operator of Peza ZM, the country's leading student digital platform.",
  alternates: { canonical: "/about/busenga-technologies" },
};

export default function BusengaTechnologiesPage() {
  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-12">
      <div className="container-medium max-w-3xl">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--nexora-navy)] text-white shadow-lg">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--nexora-navy)] sm:text-4xl">
            BUSENGA TECHNOLOGIES
          </h1>
          <p className="mt-2 text-lg font-medium text-gray-600">
            The registered business operating Peza ZM
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-gray max-w-none rounded-3xl bg-white p-8 shadow-sm border border-gray-100 sm:p-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Who We Are</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            <strong>Peza ZM</strong> is a Zambian student-focused digital platform designed to make university life easier. It brings accommodation, a student marketplace, local services, and a free educational library together in one trusted environment. 
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Peza ZM is proudly developed, managed, and operated by <strong>BUSENGA TECHNOLOGIES</strong>. 
          </p>
          <p className="text-gray-700 leading-relaxed mb-8">
            We are committed to providing a secure, reliable, and innovative digital ecosystem for students across Zambia. Our goal is to connect students with the resources and services they need to thrive during their academic journey.
          </p>

          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-emerald-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Official Registration Details</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            Busenga Technologies is formally registered with the Patents and Companies Registration Agency (PACRA) in the Republic of Zambia.
          </p>

          {/* Registration Data Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Building2 size={14} /> Registered Business Name
              </div>
              <p className="text-sm font-bold text-gray-900">BUSENGA TECHNOLOGIES</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Hash size={14} /> Business Registration Number
              </div>
              <p className="text-sm font-bold text-gray-900">320261082152</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Hash size={14} /> PACRA Serial Number
              </div>
              <p className="text-sm font-bold text-gray-900">1484738</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Calendar size={14} /> Registration Date
              </div>
              <p className="text-sm font-bold text-gray-900">9 November 2026</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Globe size={14} /> Registered Business Activity
              </div>
              <p className="text-sm font-bold text-gray-900">Other Information Technology and Computer Service Activities (6209)</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <MapPin size={14} /> Registration Authority
              </div>
              <p className="text-sm font-bold text-gray-900">Patents and Companies Registration Agency (PACRA), Zambia</p>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              To explore our platform, visit the official Peza ZM website.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[var(--nexora-primary)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
            >
              Go to pezazm.com
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}