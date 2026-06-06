import { getCardByStudyKey } from "@/lib/cards";

type Props = {
  searchParams: Promise<{ study_key?: string }>;
};

export default async function PlayPage({ searchParams }: Props) {
  const { study_key } = await searchParams;
  const card = study_key ? await getCardByStudyKey(study_key) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Play
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">
          Swipe through studies and call them Trust or Junk.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
          Stack
        </span>
        <div className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70">
          Random ▾
        </div>
      </div>

      {card ? (
        <div className="rounded-2xl border border-ink/15 bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
            Would play
          </p>
          <h2 className="mt-2 text-lg leading-tight font-semibold text-ink">
            {card.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            {card.summary.tldr}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/15 bg-white p-8 text-center">
          <p className="text-sm text-ink/70">The swipe game lands next.</p>
        </div>
      )}
    </main>
  );
}
