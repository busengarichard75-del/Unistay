// src/components/reviews/StarRating.tsx
"use client";

import { Star } from "lucide-react";

type StarSize = "sm" | "md" | "lg";

interface StarRatingProps {
  /** 0–5. Decimals allowed for read-only display (e.g. 4.5). */
  value: number;
  /** When true, renders clickable stars. value is treated as an integer. */
  interactive?: boolean;
  /** Called with 1–5 when the user clicks a star (interactive only). */
  onChange?: (value: number) => void;
  /** Visual size. */
  size?: StarSize;
  /** Show the numeric value to the right (read-only mode only). */
  showValue?: boolean;
}

const SIZES: Record<StarSize, { star: number; gap: string; text: string }> = {
  sm: { star: 11, gap: "gap-0.5", text: "text-[10px]" },
  md: { star: 14, gap: "gap-0.5", text: "text-xs" },
  lg: { star: 20, gap: "gap-1", text: "text-sm" },
};

/**
 * Renders 5 stars. Read-only supports fractional fills (via clip).
 * Interactive renders solid stars + fires onChange(1..5) on click.
 */
export function StarRating({
  value,
  interactive = false,
  onChange,
  size = "sm",
  showValue = false,
}: StarRatingProps) {
  const dims = SIZES[size];
  const clamped = Math.max(0, Math.min(5, value));

  // ─── Interactive: clickable stars ───
  if (interactive) {
    const active = Math.round(clamped);
    return (
      <div className={`inline-flex items-center ${dims.gap}`} role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= active;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={filled}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => onChange?.(n)}
              className="transition-transform active:scale-90"
            >
              <Star
                size={dims.star}
                className={filled ? "text-amber-400" : "text-gray-300"}
                fill={filled ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Read-only: fractional display ───
  return (
    <div className={`inline-flex items-center ${dims.gap}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        // Fill fraction for this star (0..1)
        const fill = Math.max(0, Math.min(1, clamped - (n - 1)));
        return (
          <span key={n} className="relative inline-block">
            {/* Empty base */}
            <Star
              size={dims.star}
              className="text-gray-300"
              fill="none"
              strokeWidth={1.5}
            />
            {/* Filled overlay, clipped by width % */}
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  size={dims.star}
                  className="text-amber-400"
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              </span>
            )}
          </span>
        );
      })}

      {showValue && clamped > 0 && (
        <span className={`ml-1 font-semibold text-gray-700 ${dims.text}`}>
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
}