import type { EngineOutput } from "@/lib/scoring";
import { BAND_STYLES, dimensionBarColor } from "./band-styles";

type Props = {
  card: EngineOutput;
  cached: boolean;
  /**
   * PubMed PMID, when the score card originated from a PubMed lookup.
   * Renders a "View on PubMed" link at the bottom of the card. Undefined
   * for manual-paste frisks and library-tile views (we don't currently
   * store PMID on the cards row).
   */
  pmid?: string;
};

export function ScoreCardView({ card, cached, pmid }: Props) {
  const { title, topic, summary, score_card: sc } = card;
  const styles = BAND_STYLES[sc.band];

  return (
    <article
      className={`rounded-2xl border bg-white p-6 shadow-sm sm:p-8 ${styles.border}`}
    >
      <header className="space-y-2">
        <h2 className="text-xl leading-tight font-semibold text-ink sm:text-2xl">
          {title}
        </h2>
        <span className="inline-block text-xs tracking-wider text-ink/60 uppercase">
          {topic}
        </span>
      </header>

      <section className="mt-6 flex items-baseline gap-4">
        <div
          className={`text-6xl leading-none font-bold tabular-nums sm:text-7xl ${styles.score}`}
        >
          {sc.overall_score}
        </div>
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block self-start rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase ${styles.badge}`}
          >
            {sc.band}
          </span>
          <span className="text-xs text-ink/60">Trust Score / 100</span>
        </div>
      </section>

      <p className="mt-6 text-base leading-relaxed text-ink sm:text-lg">
        {sc.verdict}
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-ink/15 bg-white p-4">
        <FundingIcon />
        <div>
          <div className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
            Funded by
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            {sc.funding_flag}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-background p-4 text-sm leading-relaxed text-ink">
        {summary.tldr}
      </p>

      <div className="mt-4 space-y-1 rounded-xl border border-ink/15 p-4">
        <div className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
          Biggest red flag
        </div>
        <p className="text-sm leading-relaxed text-ink">{sc.biggest_red_flag}</p>
      </div>

      <section className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold tracking-wider text-ink/60 uppercase">
          How we scored it
        </h3>
        <ul className="space-y-4">
          {sc.dimensions.map((d) => (
            <li key={d.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink">{d.name}</span>
                <span className="text-sm tabular-nums text-ink/60">
                  {d.score}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className={`h-full ${dimensionBarColor(d.score)}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed text-ink/75">{d.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      {pmid && (
        <footer className="mt-6 border-t border-ink/10 pt-4">
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View this study on PubMed ↗
          </a>
        </footer>
      )}

      {cached && (
        <footer className="mt-2 text-xs text-ink/50">Served from cache</footer>
      )}
    </article>
  );
}

function FundingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-ink/60"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 10c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
    </svg>
  );
}
