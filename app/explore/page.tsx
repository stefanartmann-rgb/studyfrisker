import Link from "next/link";
import { recentCards, searchCards } from "@/lib/cards";
import { searchPubMed } from "@/lib/pubmed";
import { Tile } from "@/app/components/Tile";
import { PubmedTile } from "@/app/components/PubmedTile";

const PAGE_SIZE = 10;
const MAX_PAGE = 50; // 500 PubMed results — generous ceiling, abuse guard

type Props = {
  searchParams: Promise<{ q?: string; p?: string }>;
};

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > MAX_PAGE) return MAX_PAGE;
  return n;
}

export default async function ExplorePage({ searchParams }: Props) {
  const { q, p } = await searchParams;
  const query = q?.trim() ?? "";
  const isSearch = query.length > 0;
  const page = parsePage(p);
  const pubmedLimit = page * PAGE_SIZE;

  const [libraryTiles, pubmedSearch] = await Promise.all([
    isSearch ? searchCards(query) : recentCards(),
    isSearch
      ? searchPubMed(query, pubmedLimit)
      : Promise.resolve({ results: [], total: 0 }),
  ]);

  const pubmedResults = pubmedSearch.results;
  const pubmedTotal = pubmedSearch.total;
  const hasLibrary = libraryTiles.length > 0;
  const hasPubmed = pubmedResults.length > 0;
  const hasAnything = hasLibrary || hasPubmed;
  const hasMore =
    isSearch && pubmedResults.length < pubmedTotal && page < MAX_PAGE;
  const moreHref = `/explore?q=${encodeURIComponent(query)}&p=${page + 1}#pubmed`;

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
        <section id="pubmed">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
              Live from PubMed
            </h2>
            <span className="text-xs tabular-nums text-ink/50">
              {pubmedResults.length} of {pubmedTotal.toLocaleString()}
            </span>
          </div>
          <ul className="space-y-4">
            {pubmedResults.map((result) => (
              <li key={result.pmid}>
                <PubmedTile result={result} />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="mt-4 text-center">
              <Link
                href={moreHref}
                className="inline-block rounded-xl border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
              >
                Show more studies
              </Link>
            </div>
          )}
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
