import Link from "next/link";
import type { CardTile } from "@/lib/cards";

type Props = { tile: CardTile };

export function Tile({ tile }: Props) {
  const friskHref = `/frisk?study_key=${encodeURIComponent(tile.study_key)}`;
  const playHref = `/play?study_key=${encodeURIComponent(tile.study_key)}`;

  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-primary uppercase">
          {tile.topic}
        </span>
        <h3 className="text-base leading-tight font-semibold text-ink sm:text-lg">
          {tile.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink/70">
          {tile.summary.tldr}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={friskHref}
          className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Frisk
        </Link>
        <Link
          href={playHref}
          className="flex-1 rounded-xl border border-primary px-3 py-2 text-center text-sm font-medium text-primary transition hover:bg-primary/5"
        >
          Play
        </Link>
      </div>
    </article>
  );
}
