const PRO_FEATURES = [
  "Unlimited frisks per day",
  "Save studies to your watchlist",
  "Email a PDF report of any frisk",
  "Bulk-frisk a reading list",
  "Mode B: for-and-against claim breakdowns",
];

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Settings
        </h1>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink/60 uppercase">
          App
        </h2>
        <div className="space-y-2 rounded-2xl border border-ink/10 bg-white px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-base font-semibold text-ink">StudyFrisker</p>
          <p className="text-sm leading-relaxed text-ink/70">
            Grading how trustworthy health science really is.
          </p>
          <p className="text-sm leading-relaxed text-ink/70">
            Built solo at AI Beavers Hamburg, June 6 2026.
          </p>
          <p className="text-sm">
            <a
              href="https://github.com/stefanartmann-rgb/studyfrisker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View source on GitHub ↗
            </a>
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
            StudyFrisker Pro
          </h2>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
            Coming soon
          </span>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-sm leading-relaxed text-ink">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground opacity-70"
          >
            Upgrade to Pro
          </button>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-ink/50">
        v1.0 · Hackathon build
      </footer>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-accent"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L19 7" />
    </svg>
  );
}
