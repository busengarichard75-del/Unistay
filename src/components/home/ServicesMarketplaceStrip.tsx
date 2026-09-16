"use client";

import Link from "next/link";
import { ArrowRight, Wrench, ShoppingBag } from "lucide-react";

export function ServicesMarketplaceStrip() {
  return (
    <section className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-4 shadow-sm sm:p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Also on Peza
        </p>

        <div className="space-y-2">
          <StripRow
            href="/services"
            icon={<Wrench size={18} />}
            title="Services"
            line="Barbers · Printing · Repairs · Transport"
            gradient="from-cyan-500 to-teal-600"
          />
          <StripRow
            href="/marketplace"
            icon={<ShoppingBag size={18} />}
            title="Marketplace"
            line="Buy & sell with students near you"
            gradient="from-orange-500 to-pink-600"
          />
        </div>
      </div>
    </section>
  );
}

function StripRow({
  href,
  icon,
  title,
  line,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  line: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl bg-white p-3 transition-all hover:shadow-sm"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--nexora-navy)]">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-gray-500">{line}</p>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--nexora-primary)]"
      />
    </Link>
  );
}