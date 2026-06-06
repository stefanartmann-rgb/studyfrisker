import { PlayClient } from "@/app/components/PlayClient";
import { isProUser } from "@/lib/upgrade";

// Each nextPubMedCard server action does esearch + efetch + a full Claude
// call. Bump the route's function budget so Netlify doesn't kill it at the
// default 10 s cap. Pro tier honours up to ~26 s.
export const maxDuration = 30;

type Props = {
  searchParams: Promise<{ topic?: string }>;
};

export default async function PlayPage({ searchParams }: Props) {
  const { topic } = await searchParams;
  const isPro = await isProUser();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Play
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">
          Live feed of PubMed studies, frisked on the fly. Swipe Trust or
          Junk and see how your call compares.
        </p>
      </header>

      {/* Keyed on topic so switching the pill remounts and resets game state */}
      <PlayClient
        key={topic ?? "random"}
        currentTopic={topic}
        isPro={isPro}
      />
    </main>
  );
}
