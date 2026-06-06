import { getStack, getTopics } from "@/lib/cards";
import { PlayClient } from "@/app/components/PlayClient";

type Props = {
  searchParams: Promise<{ topic?: string }>;
};

export default async function PlayPage({ searchParams }: Props) {
  const { topic } = await searchParams;
  const [stack, topics] = await Promise.all([getStack(topic), getTopics()]);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Play
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">
          Swipe through studies and call them Trust or Junk. See how your call
          compares to the frisker.
        </p>
      </header>

      <PlayClient stack={stack} topics={topics} currentTopic={topic} />
    </main>
  );
}
