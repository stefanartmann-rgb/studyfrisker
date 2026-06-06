import crypto from "node:crypto";
import { createSupabaseServiceClient } from "./supabase";
import type {
  Band,
  EngineOutput,
  ScoreCard,
  StudySummary,
} from "./scoring";

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
 * Cache reads gate. When true (now), repeat frisks of the same input hit
 * cache and render instantly; library tiles in Explore surface the
 * accumulated frisk history. Was briefly flipped to false for the
 * "everything live" demo phase — re-enabled because the all-live Frisk
 * path made the demo too slow (every visit = full ~15 s engine call).
 */
const SERVE_CACHED_CARDS = true;

/**
 * Tile shape used by Explore. Includes the at-a-glance score+band and
 * funding flag (pulled out of score_card jsonb on the server) so the
 * tile UI can show trust + funder without loading the full score card.
 */
export type CardTile = {
  study_key: string;
  title: string;
  topic: string;
  summary: StudySummary;
  overall_score: number;
  band: Band;
  funding_flag: string;
};

/**
 * Columns selected for tile rendering. Centralised so the three readers
 * (searchCards, recentCards, and the validator) stay in sync.
 */
const TILE_SELECT = "study_key, title, topic, summary, score_card";

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
  if (!SERVE_CACHED_CARDS) return null;
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
  if (!SERVE_CACHED_CARDS) return null;
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
 * Search the card library by free text. Matches title or topic via ILIKE.
 *
 * Title matches take precedence over topic matches (rough relevance
 * ranking). We issue two queries and merge instead of using PostgREST's
 * `.or()` because the latter doesn't handle commas in the user input
 * cleanly. summary.tldr is intentionally NOT searched in v1 — querying
 * jsonb via PostgREST is fiddly enough that it would muddy the code.
 *
 * Returns [] on any error.
 */
export async function searchCards(
  q: string,
  limit = 20,
): Promise<CardTile[]> {
  if (!SERVE_CACHED_CARDS) return [];
  const trimmed = q.trim();
  if (!trimmed) return recentCards(limit);

  try {
    const supabase = createSupabaseServiceClient();
    const safe = trimmed.replace(/[%_\\]/g, "\\$&");
    const pattern = `%${safe}%`;

    const [titleRes, topicRes] = await Promise.all([
      supabase
        .from("cards")
        .select(TILE_SELECT)
        .ilike("title", pattern)
        .order("last_verified_at", { ascending: false })
        .limit(limit),
      supabase
        .from("cards")
        .select(TILE_SELECT)
        .ilike("topic", pattern)
        .order("last_verified_at", { ascending: false })
        .limit(limit),
    ]);

    if (titleRes.error) {
      console.error("[cards] searchCards title error:", titleRes.error);
    }
    if (topicRes.error) {
      console.error("[cards] searchCards topic error:", topicRes.error);
    }

    const seen = new Set<string>();
    const merged: CardTile[] = [];
    for (const row of [...(titleRes.data ?? []), ...(topicRes.data ?? [])]) {
      const tile = rowToTile(row);
      if (!tile) continue;
      if (seen.has(tile.study_key)) continue;
      seen.add(tile.study_key);
      merged.push(tile);
      if (merged.length >= limit) break;
    }
    return merged;
  } catch (err) {
    console.error("[cards] searchCards threw:", err);
    return [];
  }
}

/**
 * Most recently verified cards. Empty-query default for Explore.
 * Returns [] on any error.
 */
export async function recentCards(limit = 20): Promise<CardTile[]> {
  if (!SERVE_CACHED_CARDS) return [];
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cards")
      .select(TILE_SELECT)
      .order("last_verified_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[cards] recentCards error:", error);
      return [];
    }
    return (data ?? []).map(rowToTile).filter((t): t is CardTile => t !== null);
  } catch (err) {
    console.error("[cards] recentCards threw:", err);
    return [];
  }
}

/**
 * Convert a raw Supabase row to a CardTile. Pulls overall_score/band/
 * funding_flag out of the score_card jsonb. Returns null on any missing
 * or wrong-typed field so the tile can be skipped without crashing.
 */
function rowToTile(row: unknown): CardTile | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.study_key !== "string") return null;
  if (typeof r.title !== "string") return null;
  if (typeof r.topic !== "string") return null;
  if (!r.summary || typeof r.summary !== "object") return null;
  const tldr = (r.summary as Record<string, unknown>).tldr;
  if (typeof tldr !== "string") return null;
  if (!r.score_card || typeof r.score_card !== "object") return null;
  const sc = r.score_card as Record<string, unknown>;
  if (typeof sc.overall_score !== "number" || !Number.isFinite(sc.overall_score)) {
    return null;
  }
  if (
    sc.band !== "Solid" &&
    sc.band !== "Mixed" &&
    sc.band !== "Weak" &&
    sc.band !== "Junk"
  ) {
    return null;
  }
  if (typeof sc.funding_flag !== "string") return null;

  return {
    study_key: r.study_key,
    title: r.title,
    topic: r.topic,
    summary: { tldr },
    overall_score: sc.overall_score,
    band: sc.band,
    funding_flag: sc.funding_flag,
  };
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
