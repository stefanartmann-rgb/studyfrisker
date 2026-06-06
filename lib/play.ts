import type { EngineOutput } from "./scoring";

/**
 * A frisked PubMed study ready for the Play queue. Inherits the full
 * engine output plus the cache key and originating PMID.
 */
export type LiveCard = EngineOutput & {
  study_key: string;
  pmid: string;
};

export type NextCardResult =
  | { status: "ok"; card: LiveCard }
  | { status: "exhausted"; message: string }
  | { status: "error"; message: string };

/**
 * Curated pool of PubMed queries the Random pill rotates through, so
 * "Random" mode delivers a varied feed instead of locking onto one query.
 */
export const RANDOM_TOPIC_POOL = [
  "vitamin D",
  "diet",
  "exercise",
  "intermittent fasting",
  "statins",
  "probiotics",
  "caffeine",
  "magnesium",
  "omega-3",
  "vitamin C",
];

/**
 * Topic pills shown above the Play feed. Casing is what gets rendered AND
 * what's passed as the ?topic= param, so it should match how a person
 * would naturally type the term — the PubMed query is case-insensitive.
 */
export const CURATED_TOPICS = [
  "Vitamin D",
  "Diet",
  "Exercise",
  "Statins",
  "Intermittent fasting",
  "Probiotics",
  "Caffeine",
  "Magnesium",
];
