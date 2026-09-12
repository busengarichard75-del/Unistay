// src/components/home/WhyPezaSection.tsx
"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Lock,
  MessageCircle,
  Zap,
  Phone,
  ArrowRight,
} from "lucide-react";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Verified Landlords",
    line: "Every listing is checked before it goes live.",
  },
  {
    icon: Search,
    title: "Free to Browse",
    line: "Search and compare all you want. No signup fee.",
  },
  {
    icon: Lock,
    title: "Private by Default",
    line: "Exact address and landlord contact only shown after confirmation.",
  },
  {
    icon: MessageCircle,
    title: "Direct Contact",
    line: "WhatsApp your landlord the moment you're confirmed.",
  },
  {
    icon: Zap,
    title: "Book in Minutes",
    line: "Request a bed in under 2 minutes from your phone.",
  },
  {
    icon: Phone,
    title: "Real Zambian Support",
    line: "Call us anytime on +260 0771319817. Real people.",
  },
];

export function WhyPezaSection() {
  return (
    <section className="container-wide pt-8">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-6 sm:p-8">
        {/* Headline */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--nexora-navy)] sm:text-2xl">
            Find your room the safe way.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
            Every landlord on Peza is verified by our team — so you never lose
            money to a scam again.
          </p>
        </div>

        {/* 6 Pillars */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Link to full page */}
        <div className="mt-5 text-center">
          <Link
            href="/why-peza"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            See how we verify landlords
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}