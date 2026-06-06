"use server";

import { friskStudy, type EngineOutput } from "@/lib/scoring";
import {
  getCachedCard,
  normalizeStudyKey,
  saveCard,
} from "@/lib/cards";

const MIN_INPUT_LENGTH = 50;
const MAX_INPUT_LENGTH = 8000;

export type FriskState =
  | { status: "idle" }
  | { status: "ok"; card: EngineOutput; cached: boolean }
  | { status: "error"; message: string };

// NOTE: `initialFriskState` cannot live here. Next.js treats every value
// export from a `"use server"` file as a server-action reference, so the
// client would receive an opaque ref instead of `{ status: "idle" }` and
// useActionState would crash on first render. The constant is defined at
// the call site in FriskForm.tsx instead. Type exports are erased at build
// time and are safe.

/**
 * Server Action driving the single-study scoring flow.
 *
 * Reads `input` from the submitted form. Normalizes into a stable cache key,
 * checks Supabase for a fresh card, falls through to the frisk engine,
 * caches the result, and returns the card. All errors are caught and
 * returned as user-facing messages; internal detail is logged server-side.
 */
export async function friskAction(
  _prev: FriskState,
  formData: FormData,
): Promise<FriskState> {
  const raw = formData.get("input");
  if (typeof raw !== "string") {
    return { status: "error", message: "Missing input." };
  }
  const input = raw.trim();
  if (input.length < MIN_INPUT_LENGTH) {
    return {
      status: "error",
      message: `Input is too short. Please paste at least ${MIN_INPUT_LENGTH} characters of study text, claim, or reference.`,
    };
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      status: "error",
      message: `Input is too long. Please trim to under ${MAX_INPUT_LENGTH} characters.`,
    };
  }

  const studyKey = normalizeStudyKey(input);

  // Cache lookup is best-effort: a cache miss or cache error just falls
  // through to the live engine call.
  const cached = await getCachedCard(studyKey);
  if (cached) {
    return { status: "ok", card: cached, cached: true };
  }

  let card: EngineOutput;
  try {
    card = await friskStudy(input);
  } catch (err) {
    console.error("[friskAction] frisk engine error:", err);
    return {
      status: "error",
      message:
        "The frisk engine had trouble scoring this. Try again, or paste a different study or claim.",
    };
  }

  // saveCard never throws, but await so the write is in flight before we
  // return — the user often re-submits the same input to check caching.
  await saveCard(studyKey, card);

  return { status: "ok", card, cached: false };
}
