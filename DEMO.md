# StudyFrisker — Demo Summary

Built solo at the **AI BEAVERS Hamburg hackathon**, June 6 2026. Live URL: <https://studyfrisker.netlify.app>. Source: <https://github.com/stefanartmann-rgb/studyfrisker>.

## What it does

StudyFrisker grades how trustworthy a health study or claim really is, and surfaces who profits from it. Paste a study or claim, get a clear Trust Score, a plain verdict, and the hidden funding angle in seconds. The whole point is **AI-grade transparency** — every score is computed live, with the reasoning shown so a human can check the work.

The consumer hook is a swipe game ("Frisk or Trust") that trains the skill of spotting weak science. The paying customer is health coaches and content creators who need to cite credible science without getting caught sharing junk.

---

## What's shipped today

The app has **four tabs** wired into a fixed bottom nav: **Explore** (default landing), **Play**, **Frisk**, **Settings**.

### Mode A — Single-study scoring (Frisk tab)

Paste a study reference, abstract, or health claim. Within ~10–15 s, get back a structured **score card**:

- **Trust Score** 0–100, computed server-side
- **Band** — Solid (75+) / Mixed (50+) / Weak (25+) / Junk (0–24), color-coded
- **One-line verdict** in plain English
- **Biggest red flag** callout
- **Funding flag** — who profits if this finding is taken seriously, with disclosed fact and clearly-labeled inference kept separate
- **Eight dimension scores** with a 1–2 sentence reason each:
  1. Study design and evidence level
  2. Funding and disclosed conflicts
  3. Framing and incentives
  4. Effect honesty
  5. Methodology rigor
  6. Sample size and power
  7. Replication and consistency
  8. Source quality
- **"View this study on PubMed ↗"** link when the score came from a PubMed source

The engine is **Anthropic Claude Sonnet 4.6** called with `output_config.format` (JSON schema) so the response shape is guaranteed. Server-side validation reorders dimensions canonically, clamps scores 0–100, and computes the band from the overall — never trusting the model to bucketize.

**Input modes** (locked-pill row above the form, mirroring Play's category pills):

- **Text** — free, active. Claim, abstract, or study reference. Min 15 chars (so one-line claims like *"Vitamin D cures cancer"* work).
- **DOI** — Pro-locked
- **URL** — Pro-locked
- **Claim Analysis** — Pro-locked (Multiple Studies Claim Analysis, the headline Pro feature)

Three ways the Frisk page is reached:
- Manual paste at `/frisk`
- `/frisk?pubmed_id=X` — server fetches the PubMed abstract, hands the live frisk to a client component (`AutoFriskClient`) so a slow Anthropic call can't time out the page's RSC stream
- `/frisk?study_key=X` — cache lookup, renders the stored card

### Explore tab

The discovery surface. Always lands on **10 PubMed cards** picked from a random topic in a curated pool — no empty state.

- **Search bar** at the top — query hits the Supabase cache library *and* PubMed live in parallel, results render in two sections ("From your library" + "Live from PubMed")
- **"Show more studies"** — Pro-locked button. Always visible to free users as an upsell cue; renders unlocked for Pro users when there's actually more to paginate to. Server-side enforced (`?p=5` clamps to 1 for free users)
- **PubMed tile** — title, journal, year, authors, PMID, and a **Frisk it** button that routes to `/frisk?pubmed_id=X`
- **Library tile** — topic pill, claim headline, "Funded by:" line, two-line summary. **No score shown** (preview only — score is the reveal you get by clicking Frisk)

PubMed integration uses **NCBI E-utilities** (`esearch`, `esummary`, `efetch`). Supports the `NCBI_API_KEY` env var for the 10 req/s rate limit; works without one at 3 req/s.

### Play tab — Frisk-or-Trust swipe game

A **TikTok-style infinite feed** of PubMed studies, each frisked on demand.

- **Topic pills**: Random (free) + Vitamin D (free) + 7 Pro-locked categories (Diet, Exercise, Statins, Intermittent fasting, Probiotics, Caffeine, Magnesium)
- **Pre-loaded queue** — 3 cards fired in parallel on mount, refills back to 3 after every swipe. By the time the user reads card 1, cards 2 and 3 are landing.
- **Closed view** (the summary card): topic, claim title, "Funded by:" line, summary tldr. **No score shown**.
- **Swipe via two buttons**: Trust or Junk
- **Reveal**: score chip in the band color, verdict, "✓ Match" / "✗ Mismatch" panel, **PubMed link**
- **Running tally**: "3 of 5 matches"
- Server-side Pro gate in `nextPubMedCard` so a hand-typed `/play?topic=Statins` URL can't bypass the locked UI

Random mode rotates queries across vitamin D, diet, exercise, intermittent fasting, statins, probiotics, caffeine, magnesium, omega-3, and vitamin C so each session feels different.

### Settings tab

App info + monetization.

- **App section** — name, tagline, hackathon line, GitHub link
- **Pro section** — feature list, Mollie test-mode upgrade button
- **Status banners** off the `?upgrade=success|canceled|error` search param (set by the upgrade return route)

---

## Pro monetization (Mollie test mode)

A working end-to-end **Pro upgrade flow** the judge can click through.

- **Stack**: Mollie test-mode payment + cookie-based Pro state
- **Test mode means no real money** — Mollie's hosted checkout shows a "test mode" banner, and instead of paying the user picks a status (Paid, Canceled, Failed, Expired) from a dropdown
- **€9.99 one-off** payment (subscription billing is post-MVP)
- **Flow**:
  1. User clicks "Upgrade to Pro" on Settings
  2. `startUpgrade` Server Action creates a Mollie payment with `redirectUrl=/upgrade/return`
  3. Browser redirects to Mollie's hosted checkout
  4. User picks "Paid"
  5. Mollie redirects back to `/upgrade/return?id=tr_…`
  6. Route handler calls `mollie.payments.get(id)` to verify status server-side
  7. If paid: sets `studyfrisker_pro=1` cookie (httpOnly, secure, sameSite=lax, 7-day max-age) and redirects to `/settings?upgrade=success`
- **Pro state** is a single cookie read everywhere with `isProUser()`; no auth, no user records

### Pro features list (Settings)

1. **Multiple Studies Claim Analysis** — paste a claim, get a multi-study for-and-against verdict (the headline Pro feature, not built yet — roadmap)
2. **All Play topic categories** — Diet, Exercise, Statins, IF, Probiotics, Caffeine, Magnesium (✅ enforced)
3. **Unlimited Explore feed** — load more than the first 10 PubMed results per search (✅ enforced)
4. **Frisk by DOI** — paste a DOI; we fetch the study record and score it
5. **Frisk by URL** — paste a journal or PubMed URL; we fetch and score
6. Unlimited frisks per day
7. Save studies to your watchlist
8. Email a PDF report of any frisk
9. Bulk-frisk a reading list

**What's actually enforced today** (items 2 and 3): Play category pills and Explore pagination are gated client-side (lock icons, route to `/settings#pro`) **and** server-side (the actions/queries reject non-Pro requests for the locked content). The rest are marketing — they appear in the Pro card so judges see the roadmap.

---

## Tech stack

- **Next.js 15** with App Router and TypeScript
- **React 19** — `useActionState` drives the form, Server Actions handle slow work
- **Tailwind CSS v4** with `@theme` token customization (no JS config)
- **Supabase** for cached `cards` (the score-card storage layer); service-role client, server-side only
- **Anthropic Messages API** — `claude-sonnet-4-6`, structured outputs via `output_config.format`
- **NCBI E-utilities** for PubMed search + abstract retrieval
- **Mollie** test mode for the Pro upgrade
- **Netlify** for hosting, auto-deploys from `main`

### Color palette (light only — the brand)

| Token | Hex | Used for |
|---|---|---|
| `--color-background` | `#F6F0E2` | Warm beige page background |
| `--color-ink` | `#0F2A1A` | Deep green-near-black for body text |
| `--color-primary` | `#166534` | Deep green for nav, headings, primary buttons |
| `--color-accent` | `#2E9E5B` | Brighter green for Solid band signal and Pro badges |

### Env vars

Required:
- `ANTHROPIC_API_KEY` (Claude Sonnet 4.6)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOLLIE_API_KEY` (test key — `test_…`)

Optional (raises PubMed rate limit from 3 → 10 req/s):
- `NCBI_API_KEY`

Scaffolded but unused yet:
- `RESEND_API_KEY` (for the PDF report Pro feature)

---

## Architecture

```
app/
├── layout.tsx               root layout, mounts TabBar
├── globals.css              Tailwind v4 @theme tokens
├── page.tsx                 redirect("/explore")
├── actions.ts               "use server" — friskAction (Mode A scoring)
├── components/
│   ├── TabBar.tsx           fixed bottom nav, 4 tabs, inline-SVG icons
│   ├── Tile.tsx             library summary card (no score — preview only)
│   ├── PubmedTile.tsx       live PubMed result tile (Frisk-it link)
│   ├── FriskForm.tsx        client form, useActionState
│   ├── ScoreCardView.tsx    the full score card (the reveal)
│   ├── AutoFriskClient.tsx  client-side auto-submit for /frisk?pubmed_id=
│   ├── PlayClient.tsx       the swipe game (infinite PubMed feed)
│   └── band-styles.ts       shared BAND_STYLES + dimensionBarColor
├── explore/page.tsx         search + tiles, random topic landing
├── play/
│   ├── page.tsx             passes isPro to PlayClient
│   └── actions.ts           nextPubMedCard Server Action
├── frisk/
│   ├── page.tsx             form OR cached card OR pubmed-frisk path
│   └── loading.tsx          spinner during navigation
├── settings/page.tsx        app info + Pro upgrade
└── upgrade/
    ├── actions.ts           startUpgrade Server Action
    └── return/route.ts      Mollie redirect-back handler

lib/
├── anthropic.ts             getAnthropicClient + callModel
├── scoring.ts               friskStudy, types, JSON schema, bandForScore
├── cards.ts                 cache layer (getCachedCard, getCardByStudyKey,
│                            searchCards, recentCards, saveCard,
│                            normalizeStudyKey)
├── pubmed.ts                searchPubMed, searchPubMedIds,
│                            fetchPubMedAbstract
├── play.ts                  PlayCard type + curated topics
├── supabase.ts              service-role client
├── mollie.ts                createTestPayment + getPayment
└── upgrade.ts               isProUser, setProCookie, isLockedTopic
```

---

## Notable engineering decisions

- **Structured outputs over a free-form prompt.** The engine uses `output_config.format` with a JSON schema, plus server-side validation that reorders dimensions, clamps scores, and computes the band. Schema validation is the actual guarantee — the prompt is a quality lever, not a contract.
- **Slow Anthropic calls live in Server Actions, not page renders.** The PubMed-frisk flow (`/frisk?pubmed_id=X`) initially crashed on Netlify when the streaming function timed out mid-response — the truncated RSC stream contained a dangling Suspense placeholder that React threw on at hydration. Fix: the page server-renders fast (just the PubMed efetch), then hands the abstract to `AutoFriskClient` which auto-submits the existing `friskAction` Server Action.
- **Summary vs score cards.** Tiles in Explore deliberately hide the Trust Score. The score is the **reveal** — earned by clicking Frisk or by swiping in Play, never spoiled on the discovery surface.
- **Pro gating server-side.** Locked-pill UI is a guidance layer; the actual gates are in the actions. A typed-in `/play?topic=Statins` URL still returns the "Pro" error from `nextPubMedCard`; `?p=5` on Explore clamps to page 1 for free users.
- **Cache-aware everywhere.** Same-input frisks short-circuit on cache hit. The 60-day re-verify rule lives in `lib/cards.ts` and uses the `last_verified_at` column.

---

## Demo walkthrough

A 90-second demo that exercises every tab and the Pro flow:

1. **`/explore`** — lands on 10 random PubMed cards. "Show more studies — Pro" cue at the bottom. Search "vitamin d" → 10 results with PubMed counter, library matches if any.
2. **Click any PubMed tile's Frisk-it button** → `/frisk?pubmed_id=X` → loading spinner → score card renders with the claim as headline, funding flag, full dimension breakdown, and a "View this study on PubMed ↗" link.
3. **`/frisk`** (back to the tab) — input mode pills show: Text active, three Pro-locked. Paste a claim like *"Vitamin D cures cancer."* → submits at 22 chars (down from the original 50 minimum) → real score card, likely Junk band.
4. **`/play`** — locked topic pills (Diet, Exercise, etc.) lead to Settings. Pick Vitamin D (free) → first card pre-loads (3 in queue). Swipe Trust or Junk → reveal with score chip + verdict + PubMed link. Keep swiping; queue refills automatically.
5. **`/settings`** — App card with GitHub link. Pro card with 9 features (Mode B first), €9.99 button, "Mollie test mode — no real charge" caption.
6. **Click "Upgrade to Pro"** → Mollie hosted checkout in test mode → pick "Paid" → returns to `/settings?upgrade=success` → green welcome banner, Pro section now shows "You're Pro ✓".
7. **Back to `/play`** — locked pills are now unlocked. **`/explore`** — locked Show More button now works.

---

## What's intentionally not built

- **Multiple Studies Claim Analysis (Mode B)** — the flagship Pro feature. Architecture is sketched in the Settings copy; the actual build (PubMed esearch → frisk N in parallel → synthesize stance/confidence/missing) is the next sprint.
- **Frisk by DOI / Frisk by URL** — would need a DOI resolver or URL parser layer. Pills are in the UI as upsell hooks.
- **Watchlist / saved studies** — requires Supabase auth + a `watchlist` table.
- **PDF report via Resend** — Resend is already scaffolded in `lib/resend.ts`; needs a PDF generator and a UI hook.
- **Bulk-frisk a reading list** — needs a list-input UI and parallel batching.
- **Webhook-based Mollie verification** — production hardening. Today we only verify on the redirect-back, which means a successful payment without a successful redirect (rare) wouldn't flip Pro.
- **A `pmid` column on the cards table** — would let library-tile-clicked score cards also link back to PubMed.

---

## Honest spec deviations

A few items where the implementation drifts from the original spec, all called out in commit history and the in-app copy:

- **Band naming**: spec said *Solid / Mixed / Shaky / Junk* at cutoffs 80 / 60 / 40 / 0. Shipped: *Solid / Mixed / Weak / Junk* at cutoffs 75 / 50 / 25 / 0. Easier to dial later — the band is computed by a single `bandForScore` function.
- **Weighted overall score**: spec called for fixed weights per dimension. Current engine produces overall by Claude's judgment — works in practice but isn't the spec.
- **`framing_readout` field**: spec'd in the output JSON; not in the current `ScoreCard`. The framing-and-incentives dimension carries the equivalent content.

---

## Commit history

26 commits today, each a working feature with a clear message. Highlights:

| Commit | What |
|---|---|
| `0376498` | Single-study scoring (Mode A) |
| `33b90ea` | Design pass: brand palette |
| `7bd86d1` | 4-tab bottom nav |
| `bf31031` | Explore tab |
| `020c7a8` | Live PubMed in Explore |
| `27919f5` | Fix client crash on slow PubMed frisks (RSC stream decoupling) |
| `d17ed3d` | Claims as headlines + prominent funding |
| `5759152` | Play — infinite live PubMed feed |
| `823a719` | Mollie test checkout + Play category gating |
| `2540a55` | Summary vs score card separation + cache re-enabled |
| `4d6544b` | "View on PubMed" link |
| `94f3264` | Frisk input-mode pills |

Each commit is shippable on its own — by design, judges can pick any commit and the app still runs.
