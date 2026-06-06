import type { Band } from "@/lib/scoring";

/**
 * Color tokens per band, shared between Tile and ScoreCardView so the
 * Solid green / Mixed amber / Weak orange / Junk red mapping has one
 * source of truth.
 */
export const BAND_STYLES: Record<
  Band,
  { badge: string; border: string; score: string }
> = {
  Solid: {
    badge: "bg-accent text-white",
    border: "border-accent/30",
    score: "text-accent",
  },
  Mixed: {
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
    score: "text-amber-700",
  },
  Weak: {
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200",
    score: "text-orange-700",
  },
  Junk: {
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
    score: "text-red-700",
  },
};

/**
 * Per-dimension progress-bar color, derived from the dimension's own
 * sub-score rather than the overall band — so a Solid card with a
 * weak Funding sub-score still shows an orange Funding bar.
 */
export function dimensionBarColor(score: number): string {
  if (score >= 75) return "bg-accent";
  if (score >= 50) return "bg-amber-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}
