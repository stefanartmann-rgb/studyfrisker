"use client";

import { useActionState } from "react";
import { friskAction, type FriskState } from "@/app/actions";
import { ScoreCardView } from "./ScoreCardView";

// Defined here (not in actions.ts) because non-function exports from a
// "use server" file are silently turned into server-action references on
// the client — the page would crash on load.
const INITIAL_STATE: FriskState = { status: "idle" };

export function FriskForm() {
  const [state, formAction, pending] = useActionState(
    friskAction,
    INITIAL_STATE,
  );

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-3">
        <textarea
          name="input"
          required
          minLength={50}
          rows={6}
          placeholder="Paste a study reference, abstract, DOI, URL or health claim"
          className="w-full resize-y rounded-xl border border-ink/15 bg-white p-4 text-sm leading-relaxed text-ink shadow-sm placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          disabled={pending}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink/60">
            Min 50 characters. Scored live, not from a list.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Frisking…" : "Frisk it"}
          </button>
        </div>
      </form>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </div>
      )}

      {state.status === "ok" && (
        <ScoreCardView card={state.card} cached={state.cached} />
      )}
    </div>
  );
}
