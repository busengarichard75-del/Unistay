"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  /** Big icon at the top (e.g. <Wrench size={28} />) */
  icon?: ReactNode;

  /** Category emoji, shown as a large centered badge (e.g. "🍲") */
  emoji?: string;

  /** Headline (e.g. "Food is coming soon") */
  title: string;

  /** Supporting line(s) */
  message: string;

  /** Optional small line under the message (e.g. "We add new providers every week") */
  subtitle?: string;

  /** Primary + secondary CTAs */
  actions?: EmptyStateAction[];

  /** Compact mode — smaller padding/icon (used when a category tab is empty) */
  compact?: boolean;
}

/**
 * Reusable empty-state card.
 *
 * Use for:
 * - "Category is coming soon" — with a Become a provider CTA
 * - "No matches for your filters" — with a Clear filters CTA
 * - "No listings yet" — with an Add listing CTA
 */
export function EmptyState({
  icon,
  emoji,
  title,
  message,
  subtitle,
  actions = [],
  compact = false,
}: EmptyStateProps) {
  const pad = compact ? "p-8" : "p-10";
  const iconSize = compact ? "h-14 w-14" : "h-16 w-16";
  const emojiText = compact ? "text-2xl" : "text-3xl";

  return (
    <div className={`card-premium ${pad} text-center`}>
      {/* Visual: emoji badge OR icon circle */}
      {emoji ? (
        <div
          className={`mx-auto mb-4 flex ${iconSize} items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner`}
        >
          <span className={emojiText}>{emoji}</span>
        </div>
      ) : icon ? (
        <div
          className={`mx-auto mb-4 flex ${iconSize} items-center justify-center rounded-full bg-blue-50 text-[var(--nexora-primary)]`}
        >
          {icon}
        </div>
      ) : null}

      {/* Title */}
      <p className="text-sm font-semibold text-[var(--nexora-text-primary)] sm:text-base">
        {title}
      </p>

      {/* Message */}
      <p className="mx-auto mt-1.5 max-w-sm text-xs text-[var(--nexora-text-secondary)] sm:text-sm">
        {message}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="mx-auto mt-2 max-w-sm text-[11px] text-gray-400">
          {subtitle}
        </p>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((a, i) => {
            const isPrimary = a.variant !== "secondary";

            const cls = isPrimary
              ? "inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
              : "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50";

            const content = (
              <>
                {isPrimary && i === 0 && <Sparkles size={12} />}
                {a.label}
                {!isPrimary && <ArrowRight size={12} />}
              </>
            );

            if (a.href) {
              return (
                <Link key={i} href={a.href} className={cls}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={i}
                type="button"
                onClick={a.onClick}
                className={cls}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Convenience presets — quick empty states used across browse pages.
 */

interface ComingSoonProps {
  /** Category label (e.g. "Food") */
  label: string;
  /** Category emoji (e.g. "🍲") */
  emoji?: string;
  /** University label (optional) — shown in message */
  universityLabel?: string;
  /** Provider signup link target — defaults to /signup/provider */
  providerHref?: string;
}

/** "Category is coming soon" preset with provider recruitment CTA. */
export function ComingSoonState({
  label,
  emoji,
  universityLabel,
  providerHref = "/signup/provider",
}: ComingSoonProps) {
  const where = universityLabel ? `near ${universityLabel}` : "on your campus";

  return (
    <EmptyState
      emoji={emoji || "✨"}
      title={`${label} is coming soon`}
      message={`We're onboarding ${label.toLowerCase()} providers ${where}. Check back in a few days.`}
      subtitle="We add new providers every week."
      actions={[
        { label: "Become a provider", href: providerHref, variant: "primary" },
        { label: "Browse all listings", onClick: () => {}, variant: "secondary" },
      ]}
      compact
    />
  );
}

interface NoMatchProps {
  keyword?: string;
  hasFilters: boolean;
  onClear: () => void;
}

/** "No matches for your search/filters" preset with clear CTA. */
export function NoMatchState({ keyword, hasFilters, onClear }: NoMatchProps) {
  return (
    <EmptyState
      emoji="🔍"
      title={keyword ? `No matches for "${keyword}"` : "No matches"}
      message={
        hasFilters
          ? "Try widening your price range or clearing some filters."
          : "Check back soon — new listings are added daily."
      }
      actions={
        hasFilters
          ? [{ label: "Clear all filters", onClick: onClear, variant: "primary" }]
          : []
      }
      compact
    />
  );
}