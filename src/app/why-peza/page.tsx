// src/app/why-peza/page.tsx
"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import {
  ShieldCheck,
  Search,
  Lock,
  MessageCircle,
  Zap,
  Phone,
  ArrowRight,
  X,
  Check,
  CheckCircle2,
  IdCard,
  Video,
  Camera,
  BedDouble,
} from "lucide-react";

const OLD_WAY = [
  "Random Facebook posts, no way to know who's real",
  "\"Send K50 to view\" before you see anything",
  "Travel across town to a place that's already full",
  "Number goes dead after payment",
  "No one to complain to",
];

const PEZA_WAY = [
  "Verified landlords only — checked by our team",
  "Free to browse. Always.",
  "See real photos, real price, real availability upfront",
  "Peza support on call if anything goes wrong",
  "Admin reviews every booking before it's confirmed",
];

const VERIFY_STEPS = [
  { icon: IdCard, title: "ID & phone confirmed", line: "Every landlord's identity is verified before they can list." },
  { icon: Video, title: "Property visited or video-verified", line: "Our team physically visits or video-verifies each property." },
  { icon: Camera, title: "Photos checked", line: "Listing photos are compared against the actual property." },
  { icon: BedDouble, title: "Bed availability confirmed", line: "We confirm the beds are actually available before going live." },
];

const PILLARS = [
  { icon: ShieldCheck, title: "Verified Landlords", line: "Every listing is checked before it goes live." },
  { icon: Search, title: "Free to Browse", line: "Search and compare all you want. No signup fee." },
  { icon: Lock, title: "Private by Default", line: "Exact address and landlord contact only shown after confirmation." },
  { icon: MessageCircle, title: "Direct Contact", line: "WhatsApp your landlord the moment you're confirmed." },
  { icon: Zap, title: "Book in Minutes", line: "Request a bed in under 2 minutes from your phone." },
  { icon: Phone, title: "Real Zambian Support", line: "Call us anytime on +260 0771319817. Real people." },
];

export default function WhyPezaPage() {
  return (
    <main className="min-h-screen bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-10 sm:py-14">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          ← Back to Home
        </Link>

        {/* Layer 1 — Headline */}
        <section className="text-center">
          <h1 className="text-2xl font-bold text-[var(--nexora-navy)] sm:text-4xl">
            Find your room the safe way.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Every landlord on Peza is verified by our team — so you never lose
            money to a scam again.
          </p>
        </section>

        {/* Layer 2 — Old way vs Peza */}
        <section className="mt-10">
          <h2 className="mb-5 text-center text-lg font-bold text-[var(--nexora-navy)] sm:text-xl">
            Booking the old way vs. booking with Peza
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Old way */}
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                  <X size={14} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-red-800">
                  Booking the old way
                </h3>
              </div>
              <ul className="space-y-2">
                {OLD_WAY.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-900/80 leading-relaxed">
                    <X size={12} className="mt-0.5 shrink-0 text-red-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Peza way */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--nexora-primary)]">
                  <Check size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--nexora-navy)]">
                  Booking with Peza
                </h3>
              </div>
              <ul className="space-y-2">
                {PEZA_WAY.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--nexora-navy)] leading-relaxed">
                    <Check size={12} className="mt-0.5 shrink-0 text-[var(--nexora-primary)]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Layer 3 — How we verify */}
        <section className="mt-10">
          <h2 className="mb-2 text-center text-lg font-bold text-[var(--nexora-navy)] sm:text-xl">
            How we verify every landlord
          </h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            Every landlord goes through 4 checks before their listing appears on Peza.
          </p>
          <div className="space-y-3">
            {VERIFY_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-primary)] text-white text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-[var(--nexora-primary)]" />
                      <p className="text-sm font-semibold text-[var(--nexora-navy)]">
                        {step.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                      {step.line}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-center text-xs font-medium text-[var(--nexora-navy)]">
            If a landlord fails any step, they don't appear on Peza.
          </p>
        </section>

        {/* Layer 4 — 6 Pillars */}
        <section className="mt-10">
          <h2 className="mb-5 text-center text-lg font-bold text-[var(--nexora-navy)] sm:text-xl">
            Why students choose Peza
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--nexora-navy)]">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                      {p.line}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Layer 5 — Trust strip + CTA */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-[var(--nexora-navy)] to-[var(--nexora-primary)] p-8 text-center text-white">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <CheckCircle2 size={22} className="mx-auto mb-1.5 opacity-90" />
              <p className="text-xs font-medium opacity-90">Verified landlords</p>
            </div>
            <div>
              <ShieldCheck size={22} className="mx-auto mb-1.5 opacity-90" />
              <p className="text-xs font-medium opacity-90">Checked listings</p>
            </div>
            <div>
              <MessageCircle size={22} className="mx-auto mb-1.5 opacity-90" />
              <p className="text-xs font-medium opacity-90">Direct contact</p>
            </div>
            <div>
              <Phone size={22} className="mx-auto mb-1.5 opacity-90" />
              <p className="text-xs font-medium opacity-90">Real support</p>
            </div>
          </div>

          <p className="mt-6 text-sm opacity-90">
            Still have questions? Call us on{" "}
            <a href="tel:+2600771319817" className="font-semibold underline">
              +260 0771319817
            </a>
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--nexora-navy)] transition-transform hover:scale-[1.03]"
          >
            Browse Properties
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  );
}