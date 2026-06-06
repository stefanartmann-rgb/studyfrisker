import { FriskForm } from "@/app/components/FriskForm";
import { ScoreCardView } from "@/app/components/ScoreCardView";
import {
  getCachedCard,
  getCardByStudyKey,
  normalizeStudyKey,
  saveCard,
} from "@/lib/cards";
import { fetchPubMedAbstract } from "@/lib/pubmed";
import { friskStudy, type EngineOutput } from "@/lib/scoring";

// Frisking a PubMed result can take 10–20s end-to-end (efetch + Claude call).
// Bump the per-route max duration so Netlify functions don't kill the request
// at the default 10s cap. Free-tier deployments may still cap below this; if
// timeouts keep firing, swap to a client-side action.
export const maxDuration = 30;

type Props = {
  searchParams: Promise<{ study_key?: string; pubmed_id?: string }>;
};

export default async function FriskPage({ searchParams }: Props) {
  const { study_key, pubmed_id } = await searchParams;

  // Mode 1: ?pubmed_id=X — fetch abstract, frisk if not already cached, render.
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
    let card: EngineOutput | null = await getCachedCard(studyKey);
    let cached = card !== null;
    if (!card) {
      try {
        card = await friskStudy(abstract);
        await saveCard(studyKey, card);
        cached = false;
      } catch (err) {
        console.error("[frisk/pubmed] friskStudy failed:", err);
        return (
          <FriskShell subhead="Frisking failed.">
            <Alert tone="red">
              We couldn&apos;t frisk this study. Try again, or paste it below
              to frisk it manually.
            </Alert>
            <div className="mt-6">
              <FriskForm />
            </div>
          </FriskShell>
        );
      }
    }

    return (
      <FriskShell
        subhead={cached ? "Score card from the library." : "Fresh from PubMed."}
      >
        <ScoreCardView card={card} cached={cached} />
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
    <div
      role="alert"
      className={`rounded-xl border p-4 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}
