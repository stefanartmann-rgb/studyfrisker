import type { Band, EngineOutput } from "@/lib/scoring";

type Props = {
  card: EngineOutput;
  cached: boolean;
};

const BAND_STYLES: Record<
  Band,
  { badge: string; border: string; score: string }
> = {
  Solid: {
    badge: "bg-accent text-white",
    border: "border-accent/30",
    score: "text-accent",
  },
  Mixed: {
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
    score: "text-amber-700",
  },
  Weak: {
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200",
    score: "text-orange-700",
  },
  Junk: {
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
    score: "text-red-700",
  },
};

function dimensionBarColor(score: number): string {
  if (score >= 75) return "bg-accent";
  if (score >= 50) return "bg-amber-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function ScoreCardView({ card, cached }: Props) {
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

      <p className="mt-6 rounded-xl bg-background p-4 text-sm leading-relaxed text-ink">
        {summary.tldr}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Callout label="Biggest red flag" body={sc.biggest_red_flag} />
        <Callout label="Funding flag" body={sc.funding_flag} />
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

      {cached && (
        <footer className="mt-6 text-xs text-ink/50">Served from cache</footer>
      )}
    </article>
  );
}

function Callout({ label, body }: { label: string; body: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-ink/15 p-4">
      <div className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
        {label}
      </div>
      <p className="text-sm leading-relaxed text-ink">{body}</p>
    </div>
  );
}
