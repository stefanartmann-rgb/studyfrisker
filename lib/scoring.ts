import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, MODEL } from "./anthropic";

/**
 * The StudyFrisker engine.
 *
 * Reads a study reference, abstract, DOI, URL, or health claim and
 * returns a structured EngineOutput whose shape matches the existing
 * public.cards table columns one-for-one (title, topic, summary, score_card).
 *
 * Server-side only — calls the Anthropic API with structured outputs.
 */

// ---------- Types ----------

export type Band = "Solid" | "Mixed" | "Weak" | "Junk";

/**
 * The 8 scoring dimensions, in canonical order. Used as the JSON-schema
 * enum AND as the canonical sort order for the dimensions array.
 */
export const DIMENSION_NAMES = [
  "Study design and evidence level",
  "Funding and disclosed conflicts",
  "Framing and incentives",
  "Effect honesty",
  "Methodology rigor",
  "Sample size and power",
  "Replication and consistency",
  "Source quality",
] as const;

export type DimensionName = (typeof DIMENSION_NAMES)[number];

export type Dimension = {
  name: DimensionName;
  score: number; // 0–100
  reason: string;
};

export type ScoreCard = {
  overall_score: number; // 0–100
  band: Band;
  verdict: string;
  biggest_red_flag: string;
  funding_flag: string;
  dimensions: Dimension[]; // exactly 8, in DIMENSION_NAMES order
};

export type StudySummary = {
  tldr: string;
};

export type EngineOutput = {
  title: string;
  topic: string;
  summary: StudySummary;
  score_card: ScoreCard;
};

// ---------- Band computation ----------

/**
 * Compute the band from a 0–100 overall score using the 4-band cutoffs:
 * Solid 75–100, Mixed 50–74, Weak 25–49, Junk 0–24.
 *
 * Computed server-side — we don't trust the model to bucketize.
 */
export function bandForScore(score: number): Band {
  if (score >= 75) return "Solid";
  if (score >= 50) return "Mixed";
  if (score >= 25) return "Weak";
  return "Junk";
}

// ---------- Engine ----------

const SYSTEM_PROMPT = `You are the StudyFrisker engine. You read a single study reference, abstract, DOI, URL, or health claim and produce a strictly-typed score card.

For each input, extract:
- title: the study's CLAIM as a single short plain-language sentence (max 80 chars) that a non-professional grasps at a glance. Say what the study found, not what it studied. No academic phrasing. No author names. No design jargon ("randomized", "double-blind") in the title — that goes in the summary.
  GOOD: "Vitamin D pills don't reduce fatigue in healthy adults"
  GOOD: "Statins lower heart-attack risk over 5 years"
  BAD:  "Effect of vitamin D supplementation on fatigue: a randomized trial"
  BAD:  "Industry-funded vitamin D fatigue trial, n=42"
  For a claim input (not a study), restate the claim itself in plain English.
- topic: 1–3 word tag, e.g. "vitamin D", "intermittent fasting", "statins".
- summary.tldr: one or two plain-English sentences with the design (RCT / observational / meta-analysis), sample size, year if known, who funded or made it if stated, and the main caveat. State disclosed fact and clearly-labeled inference separately.

Then score on these EIGHT dimensions, in this exact order:
1. Study design and evidence level
2. Funding and disclosed conflicts
3. Framing and incentives
4. Effect honesty
5. Methodology rigor
6. Sample size and power
7. Replication and consistency
8. Source quality

Each dimension gets a 0–100 sub-score and a 1–2 sentence reason. The reason states disclosed fact and clearly-labeled inference separately. NEVER assert motive as fact; when inferring from incentives, write "is consistent with" or "may indicate", not "is intended to" or "designed to".

Then produce an overall_score (0–100) — your judgment, not a strict average; a single fatal flaw can drop the overall well below the dimension mean. Then a one-line verdict, the biggest red flag (short), and the funding flag: one short line stating who profits if this finding is taken seriously, even when funding wasn't disclosed — clearly label inference.

When the input is too vague to score a dimension confidently, score it lower; do not refuse. If the input is not a study or claim at all (for example, gibberish), return overall_score 0 with a verdict explaining what the user gave you.

This is a literacy tool, not medical advice.`;

/**
 * JSON schema for the engine output. Note: numerical and array-size
 * constraints (minimum/maximum/minItems/maxItems) are not enforced by
 * structured outputs — we validate them in TypeScript after parsing.
 */
const ENGINE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "topic", "summary", "score_card"],
  properties: {
    title: { type: "string" },
    topic: { type: "string" },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["tldr"],
      properties: {
        tldr: { type: "string" },
      },
    },
    score_card: {
      type: "object",
      additionalProperties: false,
      required: [
        "overall_score",
        "verdict",
        "biggest_red_flag",
        "funding_flag",
        "dimensions",
      ],
      properties: {
        overall_score: { type: "integer" },
        verdict: { type: "string" },
        biggest_red_flag: { type: "string" },
        funding_flag: { type: "string" },
        dimensions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "score", "reason"],
            properties: {
              name: { type: "string", enum: [...DIMENSION_NAMES] },
              score: { type: "integer" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Score a study or claim. Throws on Anthropic API failure or
 * unrecoverable schema-validation failure.
 */
export async function friskStudy(input: string): Promise<EngineOutput> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
    // output_config is GA on Sonnet 4.6 but the @anthropic-ai/sdk types
    // may lag the API; cast to satisfy the compiler.
    output_config: {
      format: {
        type: "json_schema",
        schema: ENGINE_SCHEMA,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const textBlock = response.content.find(
    (b: Anthropic.ContentBlock): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    throw new Error("Frisk engine returned no text content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error("Frisk engine returned invalid JSON");
  }

  return validateEngineOutput(parsed);
}

// ---------- Validation ----------

function validateEngineOutput(parsed: unknown): EngineOutput {
  const obj = asObject(parsed, "root");

  const title = asString(obj.title, "title");
  const topic = asString(obj.topic, "topic");

  const summaryObj = asObject(obj.summary, "summary");
  const tldr = asString(summaryObj.tldr, "summary.tldr");

  const scoreCardObj = asObject(obj.score_card, "score_card");
  const overall_score = clampScore(
    asNumber(scoreCardObj.overall_score, "score_card.overall_score"),
  );
  const verdict = asString(scoreCardObj.verdict, "score_card.verdict");
  const biggest_red_flag = asString(
    scoreCardObj.biggest_red_flag,
    "score_card.biggest_red_flag",
  );
  const funding_flag = asString(
    scoreCardObj.funding_flag,
    "score_card.funding_flag",
  );

  const dimsRaw = scoreCardObj.dimensions;
  if (!Array.isArray(dimsRaw)) {
    throw new Error("score_card.dimensions is not an array");
  }

  // Build a map by name; later we reorder canonically.
  const byName = new Map<DimensionName, Dimension>();
  for (const item of dimsRaw) {
    const d = asObject(item, "dimension");
    const name = asString(d.name, "dimension.name");
    if (!isDimensionName(name)) {
      // Unknown name — skip; will fail below if a canonical one is missing.
      continue;
    }
    byName.set(name, {
      name,
      score: clampScore(asNumber(d.score, "dimension.score")),
      reason: asString(d.reason, "dimension.reason"),
    });
  }

  const dimensions: Dimension[] = [];
  for (const canonical of DIMENSION_NAMES) {
    const dim = byName.get(canonical);
    if (!dim) {
      throw new Error(`Frisk engine output missing dimension: ${canonical}`);
    }
    dimensions.push(dim);
  }

  return {
    title,
    topic,
    summary: { tldr },
    score_card: {
      overall_score,
      band: bandForScore(overall_score),
      verdict,
      biggest_red_flag,
      funding_flag,
      dimensions,
    },
  };
}

function isDimensionName(s: string): s is DimensionName {
  return (DIMENSION_NAMES as readonly string[]).includes(s);
}

function asObject(v: unknown, label: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw new Error(`Expected object at ${label}`);
  }
  return v as Record<string, unknown>;
}

function asString(v: unknown, label: string): string {
  if (typeof v !== "string") {
    throw new Error(`Expected string at ${label}`);
  }
  return v;
}

function asNumber(v: unknown, label: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`Expected number at ${label}`);
  }
  return v;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
