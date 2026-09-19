"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Zap,
  Flame,
  Globe,
  EyeOff,
} from "lucide-react";
import {
  ListingFilterState,
  SortOption,
  SORT_OPTIONS,
  SERVICE_PRICE_BUCKETS,
  PRODUCT_PRICE_BUCKETS,
  PROPERTY_PRICE_BUCKETS,
  GENDER_OPTIONS,
  DISTANCE_OPTIONS,
  COMMON_AMENITIES,
  DEFAULT_SERVICE_FILTERS,
  DEFAULT_PRODUCT_FILTERS,
  DEFAULT_PROPERTY_FILTERS,
} from "@/lib/filterListings";
import { PRODUCT_CONDITIONS } from "@/types/product";

type Mode = "services" | "products" | "properties";

interface ListingFiltersProps {
  mode: Mode;
  filters: ListingFilterState;
  onChange: (next: ListingFilterState) => void;
  resultCount: number;
  /** Hide the built-in price dropdown (used on homepage where PriceFilter already exists). */
  hidePrice?: boolean;
}

export function ListingFilters({
  mode,
  filters,
  onChange,
  resultCount,
  hidePrice = false,
}: ListingFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<ListingFilterState>(filters);
  const wrapRef = useRef<HTMLDivElement>(null);

  const isServices = mode === "services";
  const isProducts = mode === "products";
  const isProperties = mode === "properties";

  const defaults = isServices
    ? DEFAULT_SERVICE_FILTERS
    : isProducts
    ? DEFAULT_PRODUCT_FILTERS
    : DEFAULT_PROPERTY_FILTERS;

  const priceBuckets = isServices
    ? SERVICE_PRICE_BUCKETS
    : isProducts
    ? PRODUCT_PRICE_BUCKETS
    : PROPERTY_PRICE_BUCKETS;

  const showPrice = !hidePrice;

  // ── Outside-click + Escape close ──
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setSheetOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => setDraft(filters), [filters]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const update = (patch: Partial<ListingFilterState>) =>
    onChange({ ...filters, ...patch });
  const updateDraft = (patch: Partial<ListingFilterState>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const reset = () => onChange({ ...defaults });

  // ── Mode-aware active count ──
  const activeCount = useMemo(() => {
    let n = 0;
    if (showPrice && filters.priceBucket) n++;
    if (isProducts && filters.condition) n++;
    if ((isServices || isProducts) && filters.dealsOnly) n++;
    if (filters.boostedOnly) n++;
    if (isServices && filters.onlineOnly) n++;
    if (isProducts && !filters.hideSold) n++;
    if (isProperties && filters.gender) n++;
    if (isProperties && filters.distance) n++;
    if (isProperties && filters.amenities.length > 0) n += filters.amenities.length;
    if (filters.sort !== "featured") n++;
    return n;
  }, [filters, isServices, isProducts, isProperties, showPrice]);

  const priceLabel = filters.priceBucket
    ? priceBuckets.find((b) => b.id === filters.priceBucket)?.label || filters.priceBucket
    : "Price";

  const conditionLabel = filters.condition
    ? PRODUCT_CONDITIONS.find((c) => c.id === filters.condition)?.label || filters.condition
    : "Condition";

  const genderLabel = filters.gender
    ? GENDER_OPTIONS.find((g) => g.id === filters.gender)?.label || filters.gender
    : "Gender";

  const distanceLabel = filters.distance
    ? DISTANCE_OPTIONS.find((d) => d.id === filters.distance)?.label || filters.distance
    : "Distance";

  const amenitiesLabel =
    filters.amenities.length > 0
      ? `${filters.amenities.length} amenit${filters.amenities.length === 1 ? "y" : "ies"}`
      : "Amenities";

  const sortLabel =
    SORT_OPTIONS.find((s) => s.id === filters.sort)?.label || "Featured";

  const toggle = (key: string) =>
    setOpenDropdown(openDropdown === key ? null : key);

  const toggleAmenity = (a: string) => {
    const has = filters.amenities.includes(a);
    update({
      amenities: has
        ? filters.amenities.filter((x) => x !== a)
        : [...filters.amenities, a],
    });
  };

  const toggleAmenityDraft = (a: string) => {
    const has = draft.amenities.includes(a);
    updateDraft({
      amenities: has
        ? draft.amenities.filter((x) => x !== a)
        : [...draft.amenities, a],
    });
  };

  return (
    <div ref={wrapRef} className="space-y-2.5">
      {/* ── Mobile top bar ── */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm active:scale-95 transition-transform"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--nexora-primary)] px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-xs text-gray-500">
          {resultCount} {resultCount === 1 ? "listing" : "listings"}
        </span>
      </div>

      {/* ── Desktop chip row ── */}
      <div className="hidden md:flex flex-wrap items-center gap-2">
        {/* Price */}
        {showPrice && (
          <DropdownMenu
            label={priceLabel}
            active={!!filters.priceBucket}
            open={openDropdown === "price"}
            onToggle={() => toggle("price")}
          >
            <DropdownOption
              selected={!filters.priceBucket}
              onClick={() => {
                update({ priceBucket: null });
                setOpenDropdown(null);
              }}
            >
              Any price
            </DropdownOption>
            {priceBuckets.map((b) => (
              <DropdownOption
                key={b.id}
                selected={filters.priceBucket === b.id}
                onClick={() => {
                  update({ priceBucket: b.id });
                  setOpenDropdown(null);
                }}
              >
                <span className="mr-1.5">{b.icon}</span>
                {b.label}
              </DropdownOption>
            ))}
          </DropdownMenu>
        )}

        {/* Condition (products) */}
        {isProducts && (
          <DropdownMenu
            label={conditionLabel}
            active={!!filters.condition}
            open={openDropdown === "condition"}
            onToggle={() => toggle("condition")}
          >
            <DropdownOption
              selected={!filters.condition}
              onClick={() => {
                update({ condition: null });
                setOpenDropdown(null);
              }}
            >
              Any condition
            </DropdownOption>
            {PRODUCT_CONDITIONS.map((c) => (
              <DropdownOption
                key={c.id}
                selected={filters.condition === c.id}
                onClick={() => {
                  update({ condition: c.id });
                  setOpenDropdown(null);
                }}
              >
                {c.label}
              </DropdownOption>
            ))}
          </DropdownMenu>
        )}

        {/* Gender (properties) */}
        {isProperties && (
          <DropdownMenu
            label={genderLabel}
            active={!!filters.gender}
            open={openDropdown === "gender"}
            onToggle={() => toggle("gender")}
          >
            <DropdownOption
              selected={!filters.gender}
              onClick={() => {
                update({ gender: null });
                setOpenDropdown(null);
              }}
            >
              Any gender
            </DropdownOption>
            {GENDER_OPTIONS.map((g) => (
              <DropdownOption
                key={g.id}
                selected={filters.gender === g.id}
                onClick={() => {
                  update({ gender: g.id });
                  setOpenDropdown(null);
                }}
              >
                {g.label}
              </DropdownOption>
            ))}
          </DropdownMenu>
        )}

        {/* Distance (properties) */}
        {isProperties && (
          <DropdownMenu
            label={distanceLabel}
            active={!!filters.distance}
            open={openDropdown === "distance"}
            onToggle={() => toggle("distance")}
          >
            <DropdownOption
              selected={!filters.distance}
              onClick={() => {
                update({ distance: null });
                setOpenDropdown(null);
              }}
            >
              Any distance
            </DropdownOption>
            {DISTANCE_OPTIONS.map((d) => (
              <DropdownOption
                key={d.id}
                selected={filters.distance === d.id}
                onClick={() => {
                  update({ distance: d.id });
                  setOpenDropdown(null);
                }}
              >
                {d.label}
              </DropdownOption>
            ))}
          </DropdownMenu>
        )}

        {/* Amenities (properties, multi-select) */}
        {isProperties && (
          <DropdownMulti
            label={amenitiesLabel}
            active={filters.amenities.length > 0}
            open={openDropdown === "amenities"}
            onToggle={() => toggle("amenities")}
          >
            {COMMON_AMENITIES.map((a) => (
              <MultiOption
                key={a}
                selected={filters.amenities.includes(a)}
                onClick={() => toggleAmenity(a)}
              >
                {a}
              </MultiOption>
            ))}
            {filters.amenities.length > 0 && (
              <button
                type="button"
                onClick={() => update({ amenities: [] })}
                className="w-full border-t border-gray-100 px-3.5 py-2 text-left text-xs font-medium text-[var(--nexora-primary)] hover:bg-gray-50"
              >
                Clear amenities
              </button>
            )}
          </DropdownMulti>
        )}

        {/* Deals (services + products) */}
        {(isServices || isProducts) && (
          <ToggleChip
            active={filters.dealsOnly}
            onClick={() => update({ dealsOnly: !filters.dealsOnly })}
            icon={<Flame size={12} fill={filters.dealsOnly ? "currentColor" : "none"} />}
            activeClass="bg-gradient-to-r from-red-500 to-pink-600 border-transparent text-white"
          >
            Deals
          </ToggleChip>
        )}

        {/* Boosted */}
        <ToggleChip
          active={filters.boostedOnly}
          onClick={() => update({ boostedOnly: !filters.boostedOnly })}
          icon={<Zap size={12} fill={filters.boostedOnly ? "currentColor" : "none"} />}
          activeClass="bg-gradient-to-r from-yellow-400 to-amber-500 border-transparent text-white"
        >
          Boosted
        </ToggleChip>

        {/* Online (services) / Hide sold (products) */}
        {isServices && (
          <ToggleChip
            active={filters.onlineOnly}
            onClick={() => update({ onlineOnly: !filters.onlineOnly })}
            icon={<Globe size={12} />}
          >
            Online only
          </ToggleChip>
        )}
        {isProducts && (
          <ToggleChip
            active={filters.hideSold}
            onClick={() => update({ hideSold: !filters.hideSold })}
            icon={<EyeOff size={12} />}
          >
            Hide sold
          </ToggleChip>
        )}

        {/* Sort on far right */}
        <div className="ml-auto">
          <DropdownMenu
            label={sortLabel}
            active={filters.sort !== "featured"}
            open={openDropdown === "sort"}
            onToggle={() => toggle("sort")}
            align="right"
          >
            {SORT_OPTIONS.map((s) => (
              <DropdownOption
                key={s.id}
                selected={filters.sort === s.id}
                onClick={() => {
                  update({ sort: s.id });
                  setOpenDropdown(null);
                }}
              >
                {s.label}
              </DropdownOption>
            ))}
          </DropdownMenu>
        </div>
      </div>

      {/* ── Active filter pills ── */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {showPrice && filters.priceBucket && (
            <Pill onRemove={() => update({ priceBucket: null })}>{priceLabel}</Pill>
          )}
          {isProducts && filters.condition && (
            <Pill onRemove={() => update({ condition: null })}>{conditionLabel}</Pill>
          )}
          {isProperties && filters.gender && (
            <Pill onRemove={() => update({ gender: null })}>{genderLabel}</Pill>
          )}
          {isProperties && filters.distance && (
            <Pill onRemove={() => update({ distance: null })}>{distanceLabel}</Pill>
          )}
          {isProperties &&
            filters.amenities.map((a) => (
              <Pill key={a} onRemove={() => toggleAmenity(a)}>
                {a}
              </Pill>
            ))}
          {(isServices || isProducts) && filters.dealsOnly && (
            <Pill onRemove={() => update({ dealsOnly: false })}>🔥 Deals</Pill>
          )}
          {filters.boostedOnly && (
            <Pill onRemove={() => update({ boostedOnly: false })}>⚡ Boosted</Pill>
          )}
          {isServices && filters.onlineOnly && (
            <Pill onRemove={() => update({ onlineOnly: false })}>🌐 Online</Pill>
          )}
          {isProducts && !filters.hideSold && (
            <Pill onRemove={() => update({ hideSold: true })}>Showing sold</Pill>
          )}
          {filters.sort !== "featured" && (
            <Pill onRemove={() => update({ sort: "featured" })}>{sortLabel}</Pill>
          )}
          <button
            type="button"
            onClick={reset}
            className="ml-1 text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Mobile bottom sheet ── */}
      {sheetOpen && (
        <MobileSheet
          onClose={() => setSheetOpen(false)}
          onApply={() => {
            onChange(draft);
            setSheetOpen(false);
          }}
          onReset={() => setDraft({ ...defaults })}
        >
          {showPrice && (
            <SheetSection title="Price">
              <SheetChips
                options={[
                  { id: "", label: "Any" },
                  ...priceBuckets.map((b) => ({
                    id: b.id,
                    label: `${b.icon} ${b.label}`,
                  })),
                ]}
                selected={draft.priceBucket || ""}
                onChange={(id) => updateDraft({ priceBucket: id || null })}
              />
            </SheetSection>
          )}

          {isProducts && (
            <SheetSection title="Condition">
              <SheetChips
                options={[
                  { id: "", label: "Any" },
                  ...PRODUCT_CONDITIONS.map((c) => ({ id: c.id, label: c.label })),
                ]}
                selected={draft.condition || ""}
                onChange={(id) => updateDraft({ condition: id || null })}
              />
            </SheetSection>
          )}

          {isProperties && (
            <SheetSection title="Gender">
              <SheetChips
                options={[
                  { id: "", label: "Any" },
                  ...GENDER_OPTIONS.map((g) => ({ id: g.id, label: g.label })),
                ]}
                selected={draft.gender || ""}
                onChange={(id) => updateDraft({ gender: id || null })}
              />
            </SheetSection>
          )}

          {isProperties && (
            <SheetSection title="Distance">
              <SheetChips
                options={[
                  { id: "", label: "Any" },
                  ...DISTANCE_OPTIONS.map((d) => ({ id: d.id, label: d.label })),
                ]}
                selected={draft.distance || ""}
                onChange={(id) => updateDraft({ distance: id || null })}
              />
            </SheetSection>
          )}

          {isProperties && (
            <SheetSection title="Amenities">
              <div className="flex flex-wrap gap-1.5">
                {COMMON_AMENITIES.map((a) => {
                  const on = draft.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenityDraft(a)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? "bg-[var(--nexora-primary)] text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </SheetSection>
          )}

          <SheetSection title="Show only">
            <div className="flex flex-wrap gap-2">
              {(isServices || isProducts) && (
                <ToggleChip
                  active={draft.dealsOnly}
                  onClick={() => updateDraft({ dealsOnly: !draft.dealsOnly })}
                  icon={<Flame size={12} fill={draft.dealsOnly ? "currentColor" : "none"} />}
                  activeClass="bg-gradient-to-r from-red-500 to-pink-600 border-transparent text-white"
                >
                  Deals
                </ToggleChip>
              )}
              <ToggleChip
                active={draft.boostedOnly}
                onClick={() => updateDraft({ boostedOnly: !draft.boostedOnly })}
                icon={<Zap size={12} fill={draft.boostedOnly ? "currentColor" : "none"} />}
                activeClass="bg-gradient-to-r from-yellow-400 to-amber-500 border-transparent text-white"
              >
                Boosted
              </ToggleChip>
              {isServices && (
                <ToggleChip
                  active={draft.onlineOnly}
                  onClick={() => updateDraft({ onlineOnly: !draft.onlineOnly })}
                  icon={<Globe size={12} />}
                >
                  Online only
                </ToggleChip>
              )}
              {isProducts && (
                <ToggleChip
                  active={draft.hideSold}
                  onClick={() => updateDraft({ hideSold: !draft.hideSold })}
                  icon={<EyeOff size={12} />}
                >
                  Hide sold
                </ToggleChip>
              )}
            </div>
          </SheetSection>

          <SheetSection title="Sort by">
            <SheetChips
              options={SORT_OPTIONS.map((s) => ({ id: s.id, label: s.label }))}
              selected={draft.sort}
              onChange={(id) => updateDraft({ sort: id as SortOption })}
            />
          </SheetSection>
        </MobileSheet>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// INTERNAL COMPONENTS (unchanged)
// ─────────────────────────────────────────────────────────

function DropdownMenu({
  label,
  active,
  open,
  onToggle,
  align = "left",
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          active
            ? "bg-[var(--nexora-primary)] text-white"
            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-1.5 min-w-[200px] max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownMulti({
  label,
  active,
  open,
  onToggle,
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          active
            ? "bg-[var(--nexora-primary)] text-white"
            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[220px] max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-xs transition-colors ${
        selected
          ? "bg-[var(--nexora-primary)]/5 font-semibold text-[var(--nexora-primary)]"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span>{children}</span>
      {selected && <span className="text-[var(--nexora-primary)]">✓</span>}
    </button>
  );
}

function MultiOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
        selected ? "text-[var(--nexora-primary)]" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          selected
            ? "border-[var(--nexora-primary)] bg-[var(--nexora-primary)] text-white"
            : "border-gray-300 bg-white"
        }`}
      >
        {selected && <span className="text-[10px] leading-none">✓</span>}
      </span>
      <span>{children}</span>
    </button>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  children,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? activeClass ||
            "border-[var(--nexora-primary)] bg-[var(--nexora-primary)] text-white"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Pill({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--nexora-primary)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--nexora-primary)]">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--nexora-primary)]/20"
        aria-label="Remove filter"
      >
        <X size={10} />
      </button>
    </span>
  );
}

function MobileSheet({
  children,
  onClose,
  onApply,
  onReset,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900">Filters</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {children}
        </div>
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-[2] rounded-xl bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--nexora-primary-hover)]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function SheetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function SheetChips({
  options,
  selected,
  onChange,
}: {
  options: { id: string; label: string }[];
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === o.id
              ? "bg-[var(--nexora-primary)] text-white"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}