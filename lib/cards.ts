import crypto from "node:crypto";
import { createSupabaseServiceClient } from "./supabase";
import type { EngineOutput, ScoreCard, StudySummary } from "./scoring";

/**
 * Supabase cache layer for frisked study cards.
 *
 * Uses the existing public.cards table (study_key unique, jsonb columns
 * for summary + score_card, last_verified_at for the 60-day re-verify rule).
 *
 * Errors are logged but never thrown — cache infrastructure failures must
 * not break the user-facing scoring flow. The engine call can always run
 * the slow path.
 */

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/**
 * Produce a stable cache key from raw user input. SHA-256 hex of the input
 * after trimming, lowercasing, and collapsing whitespace. Lets cache hits
 * survive trivial formatting differences without depending on DOI parsing.
 */
export function normalizeStudyKey(raw: string): string {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Look up a cached card by study_key. Returns the card only if it exists
 * AND was verified within the last 60 days. Returns null on any error or
 * on a stale/partial row.
 *
 * This is the gated lookup used by the action flow — if it returns null
 * the action falls through to a live frisk.
 */
export async function getCachedCard(
  studyKey: string,
): Promise<EngineOutput | null> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cards")
      .select("title, topic, summary, score_card, last_verified_at")
      .eq("study_key", studyKey)
      .maybeSingle();

    if (error) {
      console.error("[cards] getCachedCard query error:", error);
      return null;
    }
    if (!data) return null;

    if (
      typeof data.title !== "string" ||
      typeof data.topic !== "string" ||
      !data.summary ||
      !data.score_card ||
      !data.last_verified_at
    ) {
      return null;
    }

    const lastVerifiedAtMs = new Date(data.last_verified_at).getTime();
    if (!Number.isFinite(lastVerifiedAtMs)) return null;
    if (Date.now() - lastVerifiedAtMs > SIXTY_DAYS_MS) return null;

    return {
      title: data.title,
      topic: data.topic,
      summary: data.summary as StudySummary,
      score_card: data.score_card as ScoreCard,
    };
  } catch (err) {
    console.error("[cards] getCachedCard threw:", err);
    return null;
  }
}

/**
 * Look up a card by study_key with NO age gate. Used by display surfaces
 * (Frisk page when handed a study_key from Explore, Play page stub) so a
 * stale card still renders instead of forcing a re-frisk for a view.
 */
export async function getCardByStudyKey(
  studyKey: string,
): Promise<EngineOutput | null> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cards")
      .select("title, topic, summary, score_card")
      .eq("study_key", studyKey)
      .maybeSingle();

    if (error) {
      console.error("[cards] getCardByStudyKey query error:", error);
      return null;
    }
    if (!data) return null;

    if (
      typeof data.title !== "string" ||
      typeof data.topic !== "string" ||
      !data.summary ||
      !data.score_card
    ) {
      return null;
    }

    return {
      title: data.title,
      topic: data.topic,
      summary: data.summary as StudySummary,
      score_card: data.score_card as ScoreCard,
    };
  } catch (err) {
    console.error("[cards] getCardByStudyKey threw:", err);
    return null;
  }
}

/**
 * Upsert a card keyed on study_key. Bumps last_verified_at to now on
 * conflict; created_at is preserved by the database.
 */
export async function saveCard(
  studyKey: string,
  output: EngineOutput,
): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("cards").upsert(
      {
        study_key: studyKey,
        title: output.title,
        topic: output.topic,
        summary: output.summary,
        score_card: output.score_card,
        last_verified_at: new Date().toISOString(),
      },
      { onConflict: "study_key" },
    );

    if (error) {
      console.error("[cards] saveCard upsert error:", error);
    }
  } catch (err) {
    console.error("[cards] saveCard threw:", err);
  }
}
