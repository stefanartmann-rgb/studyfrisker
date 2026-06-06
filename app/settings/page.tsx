import { startUpgrade } from "@/app/upgrade/actions";
import { isProUser } from "@/lib/upgrade";

const PRO_FEATURES: Array<{ headline: string; sub?: string }> = [
  {
    headline: "Mode B claim analysis",
    sub: "Paste a claim, get a multi-study for-and-against verdict",
  },
  {
    headline: "All Play topic categories",
    sub: "Diet, Exercise, Statins, IF, Probiotics, Caffeine, Magnesium",
  },
  { headline: "Unlimited frisks per day" },
  { headline: "Save studies to your watchlist" },
  { headline: "Email a PDF report of any frisk" },
  { headline: "Bulk-frisk a reading list" },
];

type Props = {
  searchParams: Promise<{ upgrade?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const { upgrade } = await searchParams;
  const isPro = await isProUser();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2 sm:mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Settings
        </h1>
      </header>

      {upgrade === "success" && (
        <Banner tone="green">
          🎉 Welcome to Pro. All Play topic categories are unlocked.
        </Banner>
      )}
      {upgrade === "canceled" && (
        <Banner tone="amber">
          Payment didn&apos;t go through. Try again any time.
        </Banner>
      )}
      {upgrade === "error" && (
        <Banner tone="red">
          Something went wrong setting up that payment. Try again, or come back
          later.
        </Banner>
      )}

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

      <section id="pro">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
            StudyFrisker Pro
          </h2>
          {isPro ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
              You&apos;re Pro ✓
            </span>
          ) : (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary uppercase">
              €9.99 / month
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature.headline} className="flex items-start gap-3">
                <CheckIcon active={isPro} />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {feature.headline}
                  </p>
                  {feature.sub && (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
                      {feature.sub}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {isPro ? (
            <p className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed text-ink">
              You&apos;re a Pro member. Topic categories on Play are unlocked.
              Mode B and the other Pro features are next on the build list.
            </p>
          ) : (
            <form action={startUpgrade} className="mt-6">
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
              >
                Upgrade to Pro — €9.99 / month
              </button>
              <p className="mt-2 text-center text-xs text-ink/50">
                Mollie test mode — no real charge. Demo only.
              </p>
            </form>
          )}

          <p className="mt-6 text-xs leading-relaxed text-ink/60">
            In this demo, Pro unlocks Play topic categories. Mode B claim
            analysis and the rest are on the roadmap — next commit.
          </p>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-ink/50">
        v1.0 · Hackathon build
      </footer>
    </main>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red";
  children: React.ReactNode;
}) {
  const styles =
    tone === "green"
      ? "border-accent/30 bg-accent/5 text-ink"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-800";
  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border p-4 text-sm leading-relaxed ${styles}`}
    >
      {children}
    </div>
  );
}

function CheckIcon({ active }: { active: boolean }) {
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
      className={`mt-0.5 shrink-0 ${active ? "text-accent" : "text-ink/30"}`}
      aria-hidden="true"
    >
      <path d="m5 12 5 5L19 7" />
    </svg>
  );
}
