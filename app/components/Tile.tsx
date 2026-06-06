import Link from "next/link";
import type { CardTile } from "@/lib/cards";
import { BAND_STYLES } from "./band-styles";

type Props = { tile: CardTile };

export function Tile({ tile }: Props) {
  const friskHref = `/frisk?study_key=${encodeURIComponent(tile.study_key)}`;
  const playHref = `/play?study_key=${encodeURIComponent(tile.study_key)}`;
  const badge = BAND_STYLES[tile.band].badge;

  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${badge}`}
        >
          <span className="text-sm font-bold tabular-nums">
            {tile.overall_score}
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase">
            {tile.band}
          </span>
        </span>
        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-primary uppercase">
          {tile.topic}
        </span>
      </div>

      <h3 className="text-base leading-snug font-semibold text-ink sm:text-lg">
        {tile.title}
      </h3>

      <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed">
        <FundingIcon />
        <p className="text-ink">
          <span className="font-semibold text-ink/70">Funded by:</span>{" "}
          {tile.funding_flag}
        </p>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/70">
        {tile.summary.tldr}
      </p>

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

function FundingIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-ink/50"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 10c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
    </svg>
  );
}
