# StudyFrisker

StudyFrisker grades how trustworthy health science is and surfaces who profits from it. The user pastes a study reference or a health claim; we frisk the science, score it across eight dimensions, and hand back a plain verdict. The consumer hook is a swipe game called Frisk or Trust. The paying customer is health coaches and content creators who need to cite credible science without getting caught sharing junk.

## Status today (June 6, 2026 — hackathon day)

### Shipped
- **Mode A**: paste a study → server-side Anthropic call → structured score card → cached in Supabase. Includes the full 8-dimension breakdown.
- **4-tab IA** with a fixed bottom nav: Explore (default), Play, Frisk, Settings.
- **Explore**: search the cached card library by title or topic. Tile list with two action buttons per tile (Frisk, Play).
- **PubMed live search**: same Explore query also hits NCBI E-utilities and renders a second tile section ("Live from PubMed"). Each PubMed tile shows title + journal + year + authors and a one-click Frisk button.
- **Frisk-by-study_key**: `/frisk?study_key=<sha256>` renders a library card directly with no form. Falls through to the form when the key isn't cached.
- **Frisk-by-PubMed-ID**: `/frisk?pubmed_id=<pmid>` fetches the abstract via efetch, hashes it to a study_key, and either renders the cached card (hit) or runs a live frisk + caches it (miss). `loading.tsx` covers the 10–20 s slow path.
- **Settings**: app section + Pro section with a disabled Upgrade button placeholder.
- **Theme**: beige `#F6F0E2` background, vivid blue `#2348C9` primary, accent green `#2E9E5B`, deep blue ink `#1A2B5C` text. Light mode only.

### Stubbed
- **Play tab**: shows the topic selector chrome and (when handed a `?study_key=`) the title of the card you "would play". No actual swipe game logic.
- **Pro upgrade**: button is disabled, no Mollie wiring.

### Not built
- **Mode B** (claim → for/against synthesis with curated studies).
- The **Frisk or Trust swipe game** itself.
- **Resend PDF email** for a frisk report.
- **Auth + saved library** via Supabase.
- **Weighted overall score**: the original spec called for fixed weights per dimension (20/15/15/15/10/10/10/5). The current engine produces `overall_score` by Claude's judgment, not by weighted mean.
- **`framing_readout` field**: spec'd in the original output JSON; not produced by the current engine.
- **JSON retry-once on malformed**: structured outputs (`output_config.format`) enforce the schema, so a single live failure is the only failure mode today. No retry loop.
- **"Shaky" band**: original spec had Solid 80+ / Mixed 60+ / Shaky 40+ / Junk 0–39. We shipped Solid 75+ / Mixed 50+ / **Weak** 25+ / Junk 0–24.

## Architecture

```
app/
├── layout.tsx               root layout, mounts TabBar
├── globals.css              Tailwind v4 @theme tokens (bg/ink/primary/accent)
├── page.tsx                 redirect("/explore")
├── actions.ts               "use server" — friskAction (server action driving Mode A)
├── components/
│   ├── TabBar.tsx           fixed bottom nav, inline-SVG icons
│   ├── Tile.tsx             library tile (Frisk + Play action links)
│   ├── PubmedTile.tsx       PubMed result tile (Frisk-it link)
│   ├── FriskForm.tsx        client form using React 19 useActionState
│   └── ScoreCardView.tsx    pure presentational result card
├── explore/page.tsx         search form + tile list (server, reads ?q=);
│                            queries library + PubMed in parallel
├── play/page.tsx            stub topic selector (server, reads ?study_key=)
├── frisk/page.tsx           form OR cached card by ?study_key= OR
│                            fetch+frisk by ?pubmed_id= (server)
├── frisk/loading.tsx        spinner shown during the PubMed slow path
└── settings/page.tsx        app info + Pro upsell

lib/
├── anthropic.ts             getAnthropicClient() + callModel() (generic helper)
├── scoring.ts               friskStudy(), types, JSON schema, bandForScore()
├── cards.ts                 getCachedCard (60-day-gated), getCardByStudyKey
│                            (ungated), searchCards, recentCards, saveCard,
│                            normalizeStudyKey (sha256)
├── pubmed.ts                searchPubMed (esearch + esummary),
│                            fetchPubMedAbstract (efetch plain text)
└── supabase.ts              createSupabaseServiceClient (service-role)
```

## Stack

- Next.js 15 App Router with TypeScript and Tailwind v4.
- React 19 (useActionState for the form).
- Supabase for the cached card library. Service-role client, server-side only.
- Anthropic Messages API for the frisk. Model `claude-sonnet-4-6`, structured outputs via `output_config.format` (JSON schema).
- Mollie test mode planned for Pro checkout (not wired).
- Resend planned for the emailed PDF report (not wired).
- Netlify for hosting. Auto-deploys from `main`.
- PubMed E-utilities (NCBI) for live study search in Explore and abstract fetch in the Frisk-by-PMID flow. `NCBI_API_KEY` env var raises the rate limit (3 → 10 req/s) but isn't required to call the public endpoint.

## Engine: what the frisk produces

8 dimensions, scored 0–100 with a 1–2 sentence reason. Names and order are canonical (the engine prompt + schema both enforce this):

1. Study design and evidence level
2. Funding and disclosed conflicts
3. Framing and incentives
4. Effect honesty
5. Methodology rigor
6. Sample size and power
7. Replication and consistency
8. Source quality

Bands as shipped:

| Band | Cutoff |
|---|---|
| Solid | 75–100 |
| Mixed | 50–74 |
| Weak | 25–49 |
| Junk | 0–24 |

Band is **computed server-side** by `bandForScore()` after Claude returns the overall — we don't trust the model to bucketize.

Engine output shape (matches the `cards` table columns one-for-one):

```ts
type EngineOutput = {
  title: string;
  topic: string;
  summary: { tldr: string };
  score_card: {
    overall_score: number;          // 0–100, Claude's judgment
    band: "Solid" | "Mixed" | "Weak" | "Junk";   // server-computed
    verdict: string;                // one line
    biggest_red_flag: string;
    funding_flag: string;           // who profits if this is taken seriously
    dimensions: Array<{
      name: string;                 // one of the 8 above
      score: number;                // 0–100
      reason: string;
    }>;                             // exactly 8 entries
  };
};
```

No `weight` per dimension, no `framing_readout` — see the "Not built" list.

## Framing rules (this is the liability surface — handle with care)

For the Framing and incentives dimension specifically:

- State the disclosed funder and any declared conflicts as fact.
- Name who would benefit commercially if the result holds, as a **clearly labeled inference**, in categories like supplement makers or processed-food brands, unless a specific company's funding is documented in the study itself.
- Say what the design seems built to favor, using "the design favors" language. Never "they rigged" or any claim of intent or fraud.
- Note what is missing: independent replication, long-term or hard endpoints versus surrogate markers, pre-registration.

**Mark every inference as an inference.** If funding is not disclosed, say so and treat framing as Unknown. Never assert motive as fact.

The current engine prompt encodes a weaker version of this (it says "label inference", "never assert motive as fact", and prescribes wording like "is consistent with" / "may indicate"). It does **not** yet enforce the specific structure above. Tightening the prompt to follow the rules verbatim is a known follow-up.

## Conventions

- Every secret stays server-side. `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MOLLIE_API_KEY`, `RESEND_API_KEY` must never reach the client. The four `lib/*.ts` helpers are all server-only.
- `app/actions.ts` is `"use server"`. **Only `async function` exports allowed there** — non-function exports become server-action references on the client and crash the page on load. (Burned us once: commit `fa742aa`.)
- The frisk asks for strict JSON via `output_config.format` (structured outputs). Schema validation enforces shape; no retry loop yet.
- Always show the model's reasoning per dimension. Transparency is the product, not a nice-to-have.
- Plain human language in every verdict. No buzzwords, no "it's not X it's Y" constructions, no AI-talk. A normal person should get it on first read.
- Literacy and transparency tool. Never phrase output as medical advice. Never tell anyone what to eat or take.
- Never invent study details. If funding or method isn't stated, mark Unknown and say how that lowers confidence.
- Mobile-first layout. Tailwind v4 with `@theme` tokens (`bg-background`, `text-ink`, `bg-primary`, `text-accent`, etc.).

## Hackathon rules

- Repo created fresh at kickoff. First commit is the generic starter.
- Commit after every working feature with a clear message. Judges may read the history.
- Deploy to Netlify early. The demo runs on the live URL, never on localhost.
- Hard stop on new features at 17:00. After that it is polish, deck and rehearsal only.
- Submit by 18:45. The 19:00 cut is final.

## Roadmap (cut from the bottom if time runs short)

1. ✅ **Mode A** end-to-end. Paste, frisk, render the card.
2. ✅ **4-tab IA** with Explore (search) and Settings.
3. ⬜ **Mode B** for one curated claim: 4–6 real studies pre-cached in Supabase, then a synthesized verdict (stance, confidence, what-is-missing).
4. ⬜ **Frisk or Trust swipe game** using the cached cards. Wire up the Play tab.
5. ⬜ **Mollie test checkout** for Pro. Wire up the Settings button.
6. ⬜ **Resend PDF email** of any frisk.
7. ⬜ **Supabase auth + saved library**.
8. ⬜ **Claim-mode synthesis on top of PubMed** — discover step is live (Explore + `/frisk?pubmed_id=`); what's missing is a wrapper that grabs the top N PubMed hits for a claim, frisks them in parallel, and synthesizes the for-and-against verdict (this is the Mode B intersection with PubMed).

Engine corrections that should land before any new feature work:

- Add `weight` per dimension and compute `overall_score` as a weighted mean.
- Add the `framing_readout` field.
- Tighten the engine prompt to follow the framing rules verbatim.
- JSON retry-once on malformed (low priority — structured outputs cover most cases).

## Demo plan

Live single-study frisk first to prove it's real-time. Then open the cached one-claim view for the for-and-against synthesis (when built). One claim, flawless.

## Working style for Claude Code

- **Use plan mode before any large feature.** Show the plan, wait for approval, then build. CLAUDE.md is read on plan-mode entry; surface deviations between the plan and the docs.
- **Commit after each major piece**, never lump 4 features into 1 commit.
- **Deploy as soon as the change is shippable** so the live demo URL is always current.
- **Ask before any big refactor**, before changing the generic helpers in `lib/`, or before deleting environment vars.
- Keep components small and readable. Favor clear code over clever code.
- Server-side only for Anthropic and Supabase. If you find yourself importing either client-side, you've taken a wrong turn.

## Commands

- `npm run dev` — start local dev (Next.js)
- `npm run build` — production build (also type-checks and lints)
- `npm run lint` — lint only
- Commit + push with git after each working step.

## Env vars

Required: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Optional (scaffolded, not yet used): `MOLLIE_API_KEY`, `RESEND_API_KEY`, `NCBI_API_KEY`.

`.env.local` (local dev) and Netlify environment variables (production) are separate — changes to one don't propagate to the other. Netlify needs a rebuild after env var changes.
