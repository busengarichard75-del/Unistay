"use client";

import { universities } from "@/data/universities";
import { getUniversityShortLabel } from "@/lib/universityLabels";

interface UniversityFilterProps {
  selected: string | null;
  onChange: (id: string | null) => void;
}

export function UniversityFilter({ selected, onChange }: UniversityFilterProps) {
  const available = universities.filter((u) => u.isAvailable);

  return (
    <>
      {/* Desktop: chips row */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <Chip active={selected === null} onClick={() => onChange(null)}>
          All
        </Chip>
        {available.map((u) => (
          <Chip
            key={u.id}
            active={selected === u.id}
            onClick={() => onChange(u.id)}
            title={u.name}
          >
            {getUniversityShortLabel(u.id)}
          </Chip>
        ))}
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden">
        <div className="relative">
          <select
            value={selected || ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15"
          >
            <option value="">All universities</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
      </div>
    </>
  );
}

function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--nexora-primary)] text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}