import { FriskForm } from "@/app/components/FriskForm";
import { ScoreCardView } from "@/app/components/ScoreCardView";
import { getCardByStudyKey } from "@/lib/cards";

type Props = {
  searchParams: Promise<{ study_key?: string }>;
};

export default async function FriskPage({ searchParams }: Props) {
  const { study_key } = await searchParams;
  const card = study_key ? await getCardByStudyKey(study_key) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Frisk
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">
          {card
            ? "Score card from the library."
            : "Paste a study or claim and get a Trust Score."}
        </p>
      </header>

      {card ? (
        <ScoreCardView card={card} cached />
      ) : study_key ? (
        <div className="space-y-6">
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            That card isn&apos;t in the library yet. Paste the study below to
            frisk it now.
          </div>
          <FriskForm />
        </div>
      ) : (
        <FriskForm />
      )}
    </main>
  );
}
