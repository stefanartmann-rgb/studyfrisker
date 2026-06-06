import Link from "next/link";
import { AutoFriskClient } from "@/app/components/AutoFriskClient";
import { FriskForm } from "@/app/components/FriskForm";
import { ScoreCardView } from "@/app/components/ScoreCardView";
import {
  getCachedCard,
  getCardByStudyKey,
  normalizeStudyKey,
} from "@/lib/cards";
import { fetchPubMedAbstract } from "@/lib/pubmed";
import { isProUser } from "@/lib/upgrade";

type Props = {
  searchParams: Promise<{ study_key?: string; pubmed_id?: string }>;
};

export default async function FriskPage({ searchParams }: Props) {
  const { study_key, pubmed_id } = await searchParams;
  const isPro = await isProUser();

  // Mode 1: ?pubmed_id=X — fetch abstract, render cached card directly
  // (fast path) or hand off to AutoFriskClient for the slow path.
  if (pubmed_id) {
    const abstract = await fetchPubMedAbstract(pubmed_id);
    if (!abstract) {
      return (
        <FriskShell subhead="That PubMed record couldn't be loaded.">
          <Alert tone="amber">
            PubMed didn&apos;t return an abstract for PMID {pubmed_id}. Try
            another result, or paste the study text below to frisk it manually.
          </Alert>
          <div className="mt-6">
            <FriskForm />
          </div>
        </FriskShell>
      );
    }

    const studyKey = normalizeStudyKey(abstract);
    const cached = await getCachedCard(studyKey);
    if (cached) {
      // Fast path: cached + fresh, render directly server-side.
      return (
        <FriskShell subhead="Score card from the library.">
          <ScoreCardView card={cached} cached pmid={pubmed_id} />
        </FriskShell>
      );
    }

    // Slow path: hand off to the client. The client submits the friskAction
    // Server Action, which runs the Anthropic call in its own request — not
    // inside this page's streaming response — so a slow frisk can't corrupt
    // the RSC stream and crash hydration.
    return (
      <FriskShell subhead="Fresh from PubMed.">
        <AutoFriskClient abstract={abstract} pmid={pubmed_id} />
      </FriskShell>
    );
  }

  // Mode 2: ?study_key=X — render cached card directly (ungated by age).
  if (study_key) {
    const card = await getCardByStudyKey(study_key);
    if (card) {
      return (
        <FriskShell subhead="Score card from the library.">
          <ScoreCardView card={card} cached />
        </FriskShell>
      );
    }
    return (
      <FriskShell subhead="Paste a study or claim and get a Trust Score.">
        <div className="space-y-6">
          <Alert tone="amber">
            That card isn&apos;t in the library yet. Paste the study below to
            frisk it now.
          </Alert>
          <FriskForm />
        </div>
      </FriskShell>
    );
  }

  // Mode 3: no params — the standard form, prefixed with the input-mode
  // pills (Text is free; DOI, URL, Claim Analysis are Pro-locked).
  return (
    <FriskShell subhead="Paste a study or claim and get a Trust Score.">
      <InputModePills isPro={isPro} />
      <FriskForm />
    </FriskShell>
  );
}

// ---------- input mode pills (Pro upsell) ----------

function InputModePills({ isPro }: { isPro: boolean }) {
  return (
    <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
      <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold tracking-wider text-primary-foreground uppercase">
        Text
      </span>
      <LockedPill label="DOI" isPro={isPro} />
      <LockedPill label="URL" isPro={isPro} />
      <LockedPill label="Claim Analysis" isPro={isPro} />
    </div>
  );
}

function LockedPill({ label, isPro }: { label: string; isPro: boolean }) {
  // Pro users see the pill unlocked but they still route to /settings#pro
  // because DOI / URL / Mode B aren't implemented yet — Settings is the
  // honest "Coming soon" surface.
  const classes = isPro
    ? "border border-primary text-primary hover:bg-primary/5"
    : "border border-ink/20 text-ink/40 hover:border-ink/40 hover:text-ink/60";
  return (
    <Link
      href="/settings#pro"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${classes}`}
    >
      {!isPro && <LockIcon />}
      {label}
    </Link>
  );
}

function LockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M9 11V7a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

// ---------- presentational helpers ----------

function FriskShell({
  subhead,
  children,
}: {
  subhead: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Frisk
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">{subhead}</p>
      </header>
      {children}
    </main>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "amber" | "red";
  children: React.ReactNode;
}) {
  const styles =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <div role="alert" className={`rounded-xl border p-4 text-sm ${styles}`}>
      {children}
    </div>
  );
}
