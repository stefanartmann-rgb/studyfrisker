# StudyFrisker

StudyFrisker grades how trustworthy health science is, and it surfaces who profits from it. A user enters either a health claim or a specific study reference. We frisk the science, score it, and explain the framing, then hand back a plain verdict in seconds. The consumer hook is a swipe game called Frisk or Trust. The paying customer is health coaches and content creators who need to cite credible science without getting caught sharing junk.

## Hackathon rules (read this first)

Submission repo gets created fresh at kickoff June 6. Generic starter is commit 1. Frisk logic is built live.

- Build everything fresh today. Do not import any prior project code.
- Commit after every working feature, with a clear message. Real history matters because judges may inspect it.
- Deploy to Netlify early and re-deploy often. The demo runs on the live URL, never on localhost.
- Hard stop on new features at 17:00. After that it is polish, deck and rehearsal only.
- Submit by 18:45. The 19:00 cut is final, with no exceptions.

## Two modes

- Mode A, study input. The user pastes a study reference or text. Return one score card. Clicking it opens the detail with all eight dimensions and the framing readout.
- Mode B, claim input. The user enters a health claim. Return a set of study cards, each tagged Supports or Challenges the claim, then one synthesized verdict with a stance, a confidence level and a what-is-missing note. Any card clicks through to its detail.

A card is compact: title, Trust Score, band, stance and a funder flag. The detail is the full breakdown.

## Stack

- Next.js App Router with TypeScript and Tailwind.
- Supabase for database and auth, and for caching frisk results.
- Anthropic Messages API for the frisk. Model claude-sonnet-4-6, called only server-side through the callModel helper.
- Mollie test mode for the Pro checkout.
- Resend for the emailed PDF report.
- Netlify for hosting.
- Optional PubMed E-utilities (efetch) to pull an abstract from a pasted PubMed link.

## Commands

- `npm run dev` starts local dev
- `npm run build` production build
- `npm run lint` lint
- commit with git after each working step

## Conventions

- Every secret stays server-side. Never expose ANTHROPIC_API_KEY, MOLLIE_API_KEY or any key to the client.
- The frisk route asks the model for strict JSON and parses it safely, retrying once if the JSON comes back malformed.
- Always show the model's reasoning for each dimension. The transparency is the product, not a nice-to-have.
- Plain human language in every verdict. No buzzwords, no "it's not X it's Y" constructions, no AI-talk. A normal person should get it on first read.
- This is a literacy and transparency tool. Never phrase output as medical advice and never tell anyone what to eat or take.
- Never invent study details. If funding or method is not stated, mark it Unknown and say how that lowers confidence.

## The frisk rubric

Score each dimension from 0 to 100 with a one or two sentence plain reason, then compute the weighted overall Trust Score.

1. Study design and evidence level, weight 20
2. Funding and disclosed conflicts, weight 15. Factual only: who paid and what was declared.
3. Framing and incentives, weight 15. See the framing rules below.
4. Effect honesty, weight 15. Flag relative versus absolute risk, and statistical versus real-world significance.
5. Methodology rigor, weight 10
6. Sample size and power, weight 10
7. Replication and consistency, weight 10
8. Source quality, weight 5

Bands: 80 to 100 Solid, 60 to 79 Mixed, 40 to 59 Shaky, 0 to 39 Junk.

## Framing rules (handle with care, this is the liability)

For the Framing and incentives dimension, score 0 to 100 where high means the study looks built to answer a real question with no obvious profit-driven narrative, and low means the funding, endpoints or design suggest it was built to produce a marketable result. In the reason do all of this and nothing more:

- State the disclosed funder and any declared conflicts as fact.
- Name who would benefit commercially if the result holds, as a clearly labeled inference, in categories like supplement makers or processed-food brands, unless a specific company's funding is documented in the study itself.
- Say what the design seems built to favor, using "the design favors" language. Never "they rigged" or any claim of intent or fraud.
- Note what is missing: independent replication, long-term or hard endpoints versus surrogate markers, pre-registration.

Mark every inference as an inference. If funding is not disclosed, say so and treat framing as Unknown. Never assert motive as fact.

## Output JSON

Single study: `{ overall, band, verdict, biggest_red_flag, funding_flag, framing_readout, dimensions: [ { name, score, weight, reason } ] }`

Claim: `{ claim, stance, confidence, verdict, whats_missing, studies: [ { title, overall, band, funding_flag, stance } ] }`

## Build order (cut from the bottom if time runs short)

1. Must have: Mode A end to end. Paste study, frisk, render the card, click for the detail with the framing readout.
2. Should have: Mode B for one curated claim. Pre-select four to six real studies, pre-cache their frisks in Supabase so the claim view loads instantly, then synthesize the verdict.
3. Should have: the Frisk or Trust swipe game using the same cards.
4. Should have: Mollie test checkout for Pro.
5. Nice to have: emailed PDF with Resend.
6. Nice to have: Supabase saved library with auth.
7. Stretch only if everything else is stable: open-ended claim through live PubMed search. Live search can return junk and be slow, so it is the last thing.

## Demo plan

Run a live single-study frisk first to prove it is real-time, then open the cached one-claim view for the for-and-against synthesis. One claim, flawless.

## Working style for Claude Code

- Use plan mode before any large feature. Show the plan, wait for my approval, then build.
- Keep components small and readable. I am not an engineer, so favor clear code over clever code.
- Deploy as soon as Mode A works, to prove the pipeline end to end.
- Ask before any big refactor or before changing the generic helpers.

## Env vars

ANTHROPIC_API_KEY, MOLLIE_API_KEY, RESEND_API_KEY, NCBI_API_KEY (optional), plus the Supabase URL and keys.
