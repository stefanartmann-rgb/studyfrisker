# StudyFrisker

StudyFrisker grades how trustworthy health science is and surfaces who profits from it. The user pastes a study reference or a health claim; we frisk the science, score it across eight dimensions, and hand back a plain verdict. The consumer hook is a swipe game called Frisk or Trust. The paying customer is health coaches and content creators who need to cite credible science without getting caught sharing junk.

## Status today (June 6, 2026 — hackathon day)

### Shipped

- **Mode A (Frisk)**: paste study text, abstract or a one-line claim (min 15 chars, down from 50 so short claims work) → server-side Claude call → structured score card → cached in Supabase. Full 8-dimension breakdown.
- **Frisk input-mode pills**: row above the form. "Text" active (free), "DOI" / "URL" / "Claim Analysis" Pro-locked. Locked pills show a lock icon for free users and route to `/settings#pro`. Pro users see them unlocked but they still route to `/settings#pro` (the underlying features are "Coming soon" — listed in Settings but not implemented).
- **4-tab IA** with a fixed bottom nav: Explore (default), Play, Frisk, Settings.
- **Explore**: always-populated landing. Random topic picker pulls 10 PubMed cards on load (no empty state). Search mixes the Supabase library (cached tiles) with live PubMed (live tiles) in parallel.
- **PubMed live search**: NCBI E-utilities (`esearch` + `esummary` + `efetch`). Each PubMed tile shows title + journal + year + authors and a Frisk-it link.
- **"Show more studies" Pro-gated pagination** in Explore. Always visible to free users as an upsell cue; unlocked for Pro users when there's actually more to load. Server-side clamps `?p=N` to 1 for non-Pro.
- **Frisk-by-study_key**: `/frisk?study_key=<sha256>` renders a library card directly.
- **Frisk-by-PubMed-ID**: `/frisk?pubmed_id=<pmid>` fetches the abstract via efetch, hashes it, checks cache; cache miss hands the abstract to `AutoFriskClient` which auto-submits the existing `friskAction` Server Action so the slow Claude call can't time out the page's RSC stream.
- **Play (Frisk or Trust)**: infinite TikTok-style live PubMed feed. 3-deep client-side queue (3 parallel fetches on mount, refills back to 3 after every swipe). Topic pills: Random + Vitamin D free; Diet/Exercise/Statins/IF/Probiotics/Caffeine/Magnesium Pro-locked. Trust vs Junk swipe reveals the band-colored score chip, verdict, ✓/✗ match indicator, and a clickable PubMed link.
- **Summary vs score card UX**: `Tile` (library preview) hides the score and band — it's a discovery card. `ScoreCardView` (the full reveal after clicking Frisk) shows everything: score, band, verdict, callouts, dimensions, "View this study on PubMed ↗".
- **"View on PubMed" link** on score cards when PMID is known (frisk-by-pubmed_id path + Play reveal). Cards reached via `?study_key=` don't have the link — the cards table has no `pmid` column. Follow-up.
- **Settings** with working Mollie test-mode Pro upgrade (€9.99 one-off). Cookie-based Pro state (`studyfrisker_pro=1`, httpOnly, 7 days), set after `/upgrade/return` verifies a `paid` status server-side via `mollie.payments.get(id)`. Test mode means no real money — judges pick "Paid" on Mollie's hosted page. Success/canceled/error banners off `?upgrade=…` search param. Pro section lists 9 features (Multiple Studies Claim Analysis first, since it's the headline Pro pitch).
- **Pro gating server-side**: `app/play/actions.ts` `nextPubMedCard` and `app/explore/page.tsx` both check `isProUser()` and reject locked content. Hand-typed URLs (`/play?topic=Statins`, `/explore?q=…&p=5`) can't bypass the UI locks.
- **Theme**: beige `#F6F0E2` background, deep green `#166534` primary, accent green `#2E9E5B` (brighter, for Solid signalling), deep green-near-black ink `#0F2A1A` text. Light mode only.
- **SERVE_CACHED_CARDS flag** at the top of `lib/cards.ts` lets the cache reads be turned off for an "everything live" demo phase without touching anything else. Currently `true`.

### Not built (roadmap)

- **Multiple Studies Claim Analysis** (the Mode B flagship Pro feature) — paste a claim → PubMed esearch → frisk N studies in parallel → synthesize stance + confidence + what's-missing.
- **Frisk by DOI / Frisk by URL** — pills exist as upsell hooks, no DOI resolver / URL parser yet.
- **Watchlist** — needs Supabase auth.
- **PDF email report** via Resend (Resend already in `lib/resend.ts`, unused).
- **Bulk-frisk a reading list**.
- **Auth + saved library** via Supabase.
- **Mollie webhook** verification (today we only verify on the redirect-back).
- **`pmid` column on the cards table** so library-tile-clicked score cards can also link back to PubMed.
- **Weighted overall score** — spec called for fixed dimension weights (20/15/15/15/10/10/10/5); current engine uses Claude's judgment.
- **`framing_readout` field** — spec'd in the original output JSON; not produced.
- **JSON retry-once on malformed** — structured outputs cover most cases.
- **"Shaky" band** — spec had Solid 80+ / Mixed 60+ / Shaky 40+ / Junk 0–39; we shipped Solid 75 / Mixed 50 / Weak 25 / Junk 0–24.

## Architecture

```
app/
├── layout.tsx               root layout, mounts TabBar
├── globals.css              Tailwind v4 @theme tokens (bg/ink/primary/accent)
├── page.tsx                 redirect("/explore")
├── actions.ts               "use server" — friskAction (server action driving Mode A)
├── components/
│   ├── TabBar.tsx           fixed bottom nav, inline-SVG icons
│   ├── Tile.tsx             library SUMMARY card (no score — preview only)
│   ├── PubmedTile.tsx       live PubMed result tile (Frisk-it link)
│   ├── FriskForm.tsx        client form using React 19 useActionState
│   ├── AutoFriskClient.tsx  client auto-submit for /frisk?pubmed_id=
│   │                        (decouples slow Claude calls from RSC stream)
│   ├── PlayClient.tsx       the infinite Play feed (queue + swipe game)
│   ├── ScoreCardView.tsx    the full SCORE card (the reveal)
│   └── band-styles.ts       shared BAND_STYLES + dimensionBarColor
├── explore/page.tsx         random-topic landing + search; library + PubMed
│                            in parallel; Pro-gated Show More
├── play/
│   ├── page.tsx             reads isProUser, keys PlayClient by topic
│   └── actions.ts           "use server" — nextPubMedCard (esearch random
│                            offset → efetch → friskStudy → saveCard)
├── frisk/
│   ├── page.tsx             form (with input-mode pills) OR cached card
│   │                        by ?study_key= OR fetch+frisk by ?pubmed_id=
│   └── loading.tsx          spinner during navigation
├── settings/page.tsx        app info + working Mollie Pro upgrade
└── upgrade/
    ├── actions.ts           "use server" — startUpgrade Server Action
    └── return/route.ts      GET handler verifies Mollie status, sets cookie

lib/
├── anthropic.ts             getAnthropicClient() + callModel() (generic)
├── scoring.ts               friskStudy(), types, JSON schema, bandForScore()
├── cards.ts                 SERVE_CACHED_CARDS toggle, getCachedCard,
│                            getCardByStudyKey, searchCards, recentCards,
│                            saveCard, normalizeStudyKey
├── pubmed.ts                searchPubMed (esearch + esummary),
│                            searchPubMedIds (bare ids for Play action),
│                            fetchPubMedAbstract (efetch plain text)
├── play.ts                  LiveCard type, RANDOM_TOPIC_POOL, CURATED_TOPICS
├── supabase.ts              createSupabaseServiceClient (service-role)
├── mollie.ts                createTestPayment + getPayment
├── upgrade.ts               isProUser, setProCookie, isLockedTopic,
│                            FREE_PLAY_TOPICS
└── resend.ts                sendReport (scaffolded, unused)
```

## Stack

- Next.js 15 App Router with TypeScript and Tailwind v4.
- React 19 (useActionState for the form).
- Supabase for the cached card library. Service-role client, server-side only.
- Anthropic Messages API for the frisk. Model `claude-sonnet-4-6`, structured outputs via `output_config.format` (JSON schema).
- Mollie test mode wired for the Pro checkout — `lib/mollie.ts` `createTestPayment` + `getPayment`, called from `app/upgrade/actions.ts` / `app/upgrade/return/route.ts`. `MOLLIE_API_KEY` must be set on Netlify too (same `test_…` key).
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
2. ✅ **4-tab IA** with Explore (default), Play, Frisk, Settings.
3. ✅ **Live PubMed search** in Explore + Frisk-by-PMID.
4. ✅ **Frisk or Trust swipe game** — Play tab is a live PubMed infinite feed.
5. ✅ **Mollie test checkout** for Pro (cookie-based state, redirect-only verification).
6. ✅ **Pro gating** on Play categories + Explore pagination (both client + server).
7. ⬜ **Multiple Studies Claim Analysis (Mode B)** — paste a claim → PubMed esearch → frisk N studies in parallel → synthesize stance + confidence + what's-missing. Headline Pro feature, not yet built.
8. ⬜ **Frisk by DOI / Frisk by URL** — pills exist, resolvers don't.
9. ⬜ **Resend PDF email** of any frisk.
10. ⬜ **Supabase auth + saved library / watchlist**.
11. ⬜ **Bulk-frisk a reading list**.
12. ⬜ **Mollie webhook** for production-grade payment verification.

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

Required for the core flow: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Required for the Pro upgrade: `MOLLIE_API_KEY` (test_… key — works without real money in Mollie test mode).

Optional, raises PubMed rate limit 3 → 10 req/s: `NCBI_API_KEY`.

Scaffolded but unused yet (the future PDF report Pro feature): `RESEND_API_KEY`.

`.env.local` (local dev) and Netlify environment variables (production) are separate — changes to one don't propagate to the other. Netlify needs a rebuild after env var changes.
