"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { nextPubMedCard } from "@/app/play/actions";
import { CURATED_TOPICS, type LiveCard } from "@/lib/play";
import { BAND_STYLES } from "./band-styles";

type Choice = "trust" | "junk";

const TARGET_QUEUE = 3;
const MAX_DUP_RETRIES = 3;

type Props = {
  currentTopic?: string;
  isPro: boolean;
};

export function PlayClient({ currentTopic, isPro }: Props) {
  const [queue, setQueue] = useState<LiveCard[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [matches, setMatches] = useState(0);
  const [played, setPlayed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const fetchingCountRef = useRef(0);

  // Keep the queue topped up. Fires on mount (3 parallel) and after every
  // swipe (1 sequential refill).
  useEffect(() => {
    if (exhausted) return;
    const needed =
      TARGET_QUEUE - queue.length - fetchingCountRef.current;
    for (let i = 0; i < needed; i++) {
      void fetchOne();
    }
    // fetchOne is stable for our purposes — relies on refs + the captured
    // currentTopic, which is fixed because PlayClient is keyed by topic
    // in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, exhausted]);

  async function fetchOne() {
    if (exhausted) return;
    fetchingCountRef.current += 1;
    try {
      for (let attempt = 0; attempt < MAX_DUP_RETRIES; attempt++) {
        const result = await nextPubMedCard(
          currentTopic,
          Array.from(seenRef.current),
        );
        if (result.status === "exhausted") {
          setExhausted(true);
          return;
        }
        if (result.status === "error") {
          setError(result.message);
          return;
        }
        if (seenRef.current.has(result.card.pmid)) {
          // Another in-flight fetch beat us to this PMID — retry.
          continue;
        }
        seenRef.current.add(result.card.pmid);
        setQueue((q) => [...q, result.card]);
        setError(null);
        return;
      }
    } finally {
      fetchingCountRef.current -= 1;
    }
  }

  function pick(choice: Choice) {
    if (queue.length === 0 || revealed) return;
    setUserChoice(choice);
    setRevealed(true);
  }

  function next() {
    if (queue.length === 0 || !revealed) return;
    const current = queue[0];
    const friskerSaidTrust =
      current.score_card.band === "Solid" ||
      current.score_card.band === "Mixed";
    const userSaidTrust = userChoice === "trust";
    if (friskerSaidTrust === userSaidTrust) {
      setMatches((m) => m + 1);
    }
    setPlayed((p) => p + 1);
    setQueue((q) => q.slice(1));
    setRevealed(false);
    setUserChoice(null);
  }

  const current: LiveCard | undefined = queue[0];

  return (
    <div className="space-y-6">
      <TopicPills currentTopic={currentTopic} isPro={isPro} />

      {(played > 0 || queue.length > 0 || current) && (
        <ProgressLine
          played={played}
          matches={matches}
          queueLength={queue.length}
          fetching={fetchingCountRef.current > 0}
        />
      )}

      {current ? (
        <CardView
          card={current}
          revealed={revealed}
          userChoice={userChoice}
          onPick={pick}
          onNext={next}
        />
      ) : exhausted ? (
        <ExhaustedPanel />
      ) : error ? (
        <ErrorPanel
          message={error}
          onRetry={() => {
            setError(null);
            void fetchOne();
          }}
        />
      ) : (
        <LoadingPanel />
      )}
    </div>
  );
}

function TopicPills({
  currentTopic,
  isPro,
}: {
  currentTopic?: string;
  isPro: boolean;
}) {
  const current = currentTopic?.trim().toLowerCase();
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      <Pill href="/play" label="Random" active={!current} />
      {CURATED_TOPICS.map((t) => {
        // Vitamin D is the only free curated pill; everything else is Pro.
        const isFree = t.toLowerCase() === "vitamin d";
        const locked = !isPro && !isFree;
        return (
          <Pill
            key={t}
            href={
              locked
                ? "/settings#pro"
                : `/play?topic=${encodeURIComponent(t)}`
            }
            label={t}
            active={!locked && current === t.toLowerCase()}
            locked={locked}
          />
        );
      })}
    </div>
  );
}

function Pill({
  href,
  label,
  active,
  locked,
}: {
  href: string;
  label: string;
  active: boolean;
  locked?: boolean;
}) {
  const classes = locked
    ? "border border-ink/20 text-ink/40 hover:border-ink/40 hover:text-ink/60"
    : active
      ? "bg-primary text-primary-foreground"
      : "border border-primary text-primary hover:bg-primary/5";
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${classes}`}
    >
      {locked && <LockIcon />}
      {label}
    </Link>
  );
}

function LockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M9 11V7a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

function ProgressLine({
  played,
  matches,
  queueLength,
  fetching,
}: {
  played: number;
  matches: number;
  queueLength: number;
  fetching: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs text-ink/60">
      <span className="tabular-nums">
        {matches} of {played} match{played === 1 ? "" : "es"}
      </span>
      <span className="tabular-nums">
        {queueLength} ready{fetching ? " · loading more…" : ""}
      </span>
    </div>
  );
}

function CardView({
  card,
  revealed,
  userChoice,
  onPick,
  onNext,
}: {
  card: LiveCard;
  revealed: boolean;
  userChoice: Choice | null;
  onPick: (c: Choice) => void;
  onNext: () => void;
}) {
  const sc = card.score_card;
  const styles = BAND_STYLES[sc.band];
  const friskerSaidTrust = sc.band === "Solid" || sc.band === "Mixed";
  const userSaidTrust = userChoice === "trust";
  const match = revealed && userSaidTrust === friskerSaidTrust;

  return (
    <>
      <article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            {card.topic}
          </span>
          {revealed && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${styles.badge}`}
            >
              <span className="text-sm font-bold tabular-nums">
                {sc.overall_score}
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase">
                {sc.band}
              </span>
            </span>
          )}
        </div>

        <h2 className="text-xl leading-snug font-semibold text-ink sm:text-2xl">
          {card.title}
        </h2>

        <div className="mt-4 flex items-start gap-2 text-sm leading-relaxed">
          <FundingIcon />
          <p className="text-ink">
            <span className="font-semibold text-ink/70">Funded by:</span>{" "}
            {sc.funding_flag}
          </p>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink/75">
          {card.summary.tldr}
        </p>

        {revealed && (
          <div
            className={`mt-6 rounded-xl border p-4 ${
              match
                ? "border-accent/30 bg-accent/5"
                : "border-red-300 bg-red-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">
                You said {userSaidTrust ? "Trust" : "Junk"}
              </span>
              <span
                className={`text-xs font-semibold tracking-wider uppercase ${
                  match ? "text-accent" : "text-red-700"
                }`}
              >
                {match ? "✓ Match" : "✗ Mismatch"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink">{sc.verdict}</p>
            <p className="mt-2 text-xs text-ink/50">
              PubMed PMID {card.pmid}
            </p>
          </div>
        )}
      </article>

      {!revealed ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => onPick("junk")}
            className="rounded-xl border-2 border-red-300 bg-white px-5 py-4 text-base font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.98]"
          >
            Junk
          </button>
          <button
            onClick={() => onPick("trust")}
            className="rounded-xl border-2 border-accent bg-white px-5 py-4 text-base font-semibold text-accent transition hover:bg-accent/5 active:scale-[0.98]"
          >
            Trust
          </button>
        </div>
      ) : (
        <button
          onClick={onNext}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90"
        >
          Next study
        </button>
      )}
    </>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center">
      <div
        aria-hidden="true"
        className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-primary"
      />
      <p className="mt-4 text-sm text-ink/70">
        Pulling a fresh study from PubMed…
      </p>
      <p className="mt-1 text-xs text-ink/50">
        First card takes 10–20 seconds.
      </p>
    </div>
  );
}

function ExhaustedPanel() {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center">
      <p className="text-sm leading-relaxed text-ink/70">
        You&apos;ve seen everything we could pull for this topic. Pick another
        topic above, or hit Random for a mixed feed.
      </p>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm leading-relaxed text-red-800">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Try the next study
      </button>
    </div>
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
