import { AutoFriskClient } from "@/app/components/AutoFriskClient";
import { FriskForm } from "@/app/components/FriskForm";
import { ScoreCardView } from "@/app/components/ScoreCardView";
import {
  getCachedCard,
  getCardByStudyKey,
  normalizeStudyKey,
} from "@/lib/cards";
import { fetchPubMedAbstract } from "@/lib/pubmed";

type Props = {
  searchParams: Promise<{ study_key?: string; pubmed_id?: string }>;
};

export default async function FriskPage({ searchParams }: Props) {
  const { study_key, pubmed_id } = await searchParams;

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
          <ScoreCardView card={cached} cached />
        </FriskShell>
      );
    }

    // Slow path: hand off to the client. The client submits the friskAction
    // Server Action, which runs the Anthropic call in its own request — not
    // inside this page's streaming response — so a slow frisk can't corrupt
    // the RSC stream and crash hydration.
    return (
      <FriskShell subhead="Fresh from PubMed.">
        <AutoFriskClient abstract={abstract} />
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

  // Mode 3: no params — the standard form.
  return (
    <FriskShell subhead="Paste a study or claim and get a Trust Score.">
      <FriskForm />
    </FriskShell>
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
