import type { Band, EngineOutput } from "@/lib/scoring";

type Props = {
  card: EngineOutput;
  cached: boolean;
};

const BAND_STYLES: Record<
  Band,
  { badge: string; border: string; score: string; bar: string }
> = {
  Solid: {
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    border: "border-green-200 dark:border-green-900",
    score: "text-green-700 dark:text-green-400",
    bar: "bg-green-500",
  },
  Mixed: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900",
    score: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  Weak: {
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-900",
    score: "text-orange-700 dark:text-orange-400",
    bar: "bg-orange-500",
  },
  Junk: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    border: "border-red-200 dark:border-red-900",
    score: "text-red-700 dark:text-red-400",
    bar: "bg-red-500",
  },
};

function dimensionBarColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function ScoreCardView({ card, cached }: Props) {
  const { title, topic, summary, score_card: sc } = card;
  const styles = BAND_STYLES[sc.band];

  return (
    <article
      className={`rounded-2xl border ${styles.border} bg-white p-6 shadow-sm sm:p-8 dark:bg-gray-900`}
    >
      <header className="space-y-2">
        <h2 className="text-xl leading-tight font-semibold sm:text-2xl">
          {title}
        </h2>
        <span className="inline-block text-xs tracking-wider text-gray-500 uppercase dark:text-gray-400">
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
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Trust Score / 100
          </span>
        </div>
      </section>

      <p className="mt-6 text-base leading-relaxed sm:text-lg">{sc.verdict}</p>

      <p className="mt-6 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
        {summary.tldr}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Callout label="Biggest red flag" body={sc.biggest_red_flag} />
        <Callout label="Funding flag" body={sc.funding_flag} />
      </div>

      <section className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
          How we scored it
        </h3>
        <ul className="space-y-4">
          {sc.dimensions.map((d) => (
            <li key={d.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{d.name}</span>
                <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
                  {d.score}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full ${dimensionBarColor(d.score)}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {d.reason}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {cached && (
        <footer className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Served from cache
        </footer>
      )}
    </article>
  );
}

function Callout({ label, body }: { label: string; body: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
        {label}
      </div>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
}
