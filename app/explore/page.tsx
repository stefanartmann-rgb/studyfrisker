import Link from "next/link";
import { recentCards, searchCards } from "@/lib/cards";
import { searchPubMed } from "@/lib/pubmed";
import { Tile } from "@/app/components/Tile";
import { PubmedTile } from "@/app/components/PubmedTile";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const isSearch = query.length > 0;

  const [libraryTiles, pubmedResults] = await Promise.all([
    isSearch ? searchCards(query) : recentCards(),
    isSearch ? searchPubMed(query, 10) : Promise.resolve([]),
  ]);

  const hasLibrary = libraryTiles.length > 0;
  const hasPubmed = pubmedResults.length > 0;
  const hasAnything = hasLibrary || hasPubmed;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Explore
        </h1>
        <p className="text-sm text-ink/70 sm:text-base">
          Search your frisk library and PubMed live.
        </p>
      </header>

      <form method="get" action="/explore" className="mb-8 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search a claim, topic or study…"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {hasLibrary && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink/60 uppercase">
            {isSearch ? "From your library" : "Recent"}
          </h2>
          <ul className="space-y-4">
            {libraryTiles.map((tile) => (
              <li key={tile.study_key}>
                <Tile tile={tile} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasPubmed && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink/60 uppercase">
            Live from PubMed
          </h2>
          <ul className="space-y-4">
            {pubmedResults.map((result) => (
              <li key={result.pmid}>
                <PubmedTile result={result} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasAnything && isSearch && (
        <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
          <p className="text-sm text-ink/70">
            No matches for &ldquo;{query}&rdquo;. Try a different search.
          </p>
        </div>
      )}

      {!hasAnything && !isSearch && (
        <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center">
          <p className="text-sm text-ink/70">
            No cards yet. Start by frisking a study.
          </p>
          <Link
            href="/frisk"
            className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Open Frisk
          </Link>
        </div>
      )}
    </main>
  );
}
