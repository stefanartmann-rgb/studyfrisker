# StudyFrisker

StudyFrisker grades how trustworthy a health study or claim really is, and surfaces who profits from it. Paste a study or a claim and get a clear Trust Score, a plain verdict and the hidden funding angle in seconds.

Live demo: <https://studyfrisker.netlify.app>

## The problem

AI made confident health nonsense free and infinite. Most people, and most chatbots, cannot tell a clean trial from a small, industry-funded or p-hacked one. StudyFrisker is the credibility layer that does the skeptical reading for you.

## What it does

**Explore.** Lands on a fresh feed of 10 PubMed studies, scored on demand. Search any claim, topic or study to mix your frisked library with live results from PubMed.

**Frisk a study or claim.** Paste a study reference, an abstract or a one-line health claim. Get back the full score card: a Trust Score out of 100, a band from Solid to Junk, the one-line verdict, the biggest red flag, the funding flag, a plain summary and a breakdown across eight dimensions, each with a one-sentence reason. Cards link straight back to PubMed for the source.

**Frisk or Trust (game).** Swipe through an infinite feed of live PubMed studies, judge each one Trust or Junk, then see how your call compares to the frisker. It trains the skill of spotting weak science.

Cards are generated once on demand, stored for all users and re-verified only when older than 60 days.

## How scoring works

Each study is scored across eight dimensions:

1. Study design and evidence level
2. Funding and disclosed conflicts
3. Framing and incentives
4. Effect honesty
5. Methodology rigor
6. Sample size and power
7. Replication and consistency
8. Source quality

The framing dimension keeps disclosed fact separate from clearly labeled inference and never asserts motive as fact.

This is a literacy and transparency tool, not medical advice and not a clinical instrument. Every score is computed live and shown with its reasoning so a human can check the work.

## Pro tier

A Mollie-powered upgrade unlocks the seven topic categories in the swipe game, deep search in Explore, and the headline feature: Multiple Studies Claim Analysis (paste a claim, get a multi-study for-and-against verdict). The demo uses Mollie test mode, so no real money changes hands — judges pick "Paid" from a dropdown on the hosted checkout.

## Tech stack

Next.js 15 with TypeScript and Tailwind. Supabase for storage. The Anthropic API for the frisk engine. NCBI E-utilities for live PubMed search. Mollie test mode for the Pro checkout. Deployed on Netlify. All model and database calls run server-side, so no secret keys reach the client.

## Run it locally

1. Install dependencies: `npm install`
2. Create a Supabase project with a `cards` table, then add a `.env.local`:

```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MOLLIE_API_KEY=          # test_ key, optional unless you're testing Pro
NCBI_API_KEY=            # optional, raises PubMed rate limit 3 → 10 req/s
```

3. Start the dev server: `npm run dev`

## Built at the hackathon

Built solo at the AI BEAVERS founder hackathon in Hamburg on June 6, 2026. The first commit is a generic starter with Next.js, Tailwind, a Supabase client and env scaffolding. Everything specific to StudyFrisker — the frisk engine, the scoring rubric, the score cards, the live PubMed search, the swipe game, the Pro upgrade, the Supabase schema — was built during the event. The commit history reflects the day.

See [DEMO.md](./DEMO.md) for a full breakdown of what shipped.
