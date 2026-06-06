"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlayCard } from "@/lib/cards";
import { BAND_STYLES } from "./band-styles";

type Choice = "trust" | "junk";

type Props = {
  stack: PlayCard[];
  topics: string[];
  currentTopic?: string;
};

export function PlayClient({ stack, topics, currentTopic }: Props) {
  const stackKey = stack.map((c) => c.study_key).join("-") || "empty";

  return (
    <div className="space-y-6">
      <TopicPills topics={topics} currentTopic={currentTopic} />
      <Game key={stackKey} stack={stack} />
    </div>
  );
}

function TopicPills({
  topics,
  currentTopic,
}: {
  topics: string[];
  currentTopic?: string;
}) {
  const current = currentTopic?.trim().toLowerCase();
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      <Pill href="/play" label="Random" active={!current} />
      {topics.map((t) => (
        <Pill
          key={t}
          href={`/play?topic=${encodeURIComponent(t)}`}
          label={t}
          active={current === t.toLowerCase()}
        />
      ))}
    </div>
  );
}

function Pill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const classes = active
    ? "bg-primary text-primary-foreground"
    : "border border-primary text-primary hover:bg-primary/5";
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${classes}`}
    >
      {label}
    </Link>
  );
}

function Game({ stack }: { stack: PlayCard[] }) {
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [revealed, setRevealed] = useState(false);

  if (stack.length === 0) {
    return <EmptyState />;
  }

  if (index >= stack.length) {
    return (
      <Results
        stack={stack}
        choices={choices}
        onPlayAgain={() => {
          setIndex(0);
          setChoices([]);
          setRevealed(false);
        }}
      />
    );
  }

  const card = stack[index];
  const matches = countMatches(stack, choices);

  function pick(choice: Choice) {
    setChoices((prev) => [...prev, choice]);
    setRevealed(true);
  }

  function next() {
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  const userChoice = revealed ? choices[choices.length - 1] : null;

  return (
    <div>
      <ProgressLine
        index={index}
        total={stack.length}
        matches={matches}
      />
      <PlayCardView card={card} revealed={revealed} userChoice={userChoice} />
      {!revealed ? (
        <ChoiceButtons onPick={pick} />
      ) : (
        <button
          onClick={next}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90"
        >
          {index === stack.length - 1 ? "See results" : "Next study"}
        </button>
      )}
    </div>
  );
}

function ProgressLine({
  index,
  total,
  matches,
}: {
  index: number;
  total: number;
  matches: number;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 text-xs text-ink/60">
      <span>
        Card {index + 1} of {total}
      </span>
      <span className="tabular-nums">
        {matches} match{matches === 1 ? "" : "es"} so far
      </span>
    </div>
  );
}

function PlayCardView({
  card,
  revealed,
  userChoice,
}: {
  card: PlayCard;
  revealed: boolean;
  userChoice: Choice | null;
}) {
  const sc = card.score_card;
  const styles = BAND_STYLES[sc.band];
  const friskerSaidTrust = sc.band === "Solid" || sc.band === "Mixed";
  const userSaidTrust = userChoice === "trust";
  const match = revealed && userSaidTrust === friskerSaidTrust;

  return (
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
        </div>
      )}
    </article>
  );
}

function ChoiceButtons({ onPick }: { onPick: (c: Choice) => void }) {
  return (
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
  );
}

function Results({
  stack,
  choices,
  onPlayAgain,
}: {
  stack: PlayCard[];
  choices: Choice[];
  onPlayAgain: () => void;
}) {
  const matches = countMatches(stack, choices);
  const pct = Math.round((matches / stack.length) * 100);
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold text-primary sm:text-3xl">
        Stack complete
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink">
        You agreed with the frisker{" "}
        <span className="font-bold tabular-nums">
          {matches} of {stack.length}
        </span>{" "}
        times <span className="text-ink/60">({pct}%)</span>
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onPlayAgain}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Play this stack again
        </button>
        <Link
          href="/play"
          className="rounded-xl border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
        >
          Pick a new stack
        </Link>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center">
      <p className="text-sm leading-relaxed text-ink/70">
        No studies in this stack yet. Frisk a few to build a deck to play with.
      </p>
      <Link
        href="/frisk"
        className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Open Frisk
      </Link>
    </div>
  );
}

function countMatches(stack: PlayCard[], choices: Choice[]): number {
  let matches = 0;
  for (let i = 0; i < choices.length; i++) {
    const card = stack[i];
    if (!card) continue;
    const friskerSaidTrust =
      card.score_card.band === "Solid" || card.score_card.band === "Mixed";
    const userSaidTrust = choices[i] === "trust";
    if (friskerSaidTrust === userSaidTrust) matches++;
  }
  return matches;
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
