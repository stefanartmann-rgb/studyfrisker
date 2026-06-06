"use client";

import { useActionState, useEffect, useRef } from "react";
import { friskAction, type FriskState } from "@/app/actions";
import { ScoreCardView } from "./ScoreCardView";

// Defined here (not in actions.ts) for the same reason as INITIAL_STATE
// in FriskForm: non-function exports from a "use server" file are silently
// turned into server-action references on the client.
const INITIAL_STATE: FriskState = { status: "idle" };

type Props = {
  abstract: string;
};

/**
 * Auto-submitting frisk client. Used by the PubMed flow: the server
 * renders this component with the PubMed abstract, the client immediately
 * submits the friskAction Server Action on mount, and the result renders
 * here without blocking the page render.
 *
 * The slow Anthropic call runs inside the Server Action's request, not
 * inside the page's streaming response — so Netlify's RSC-stream timeout
 * can't corrupt the render and trigger a hydration crash on slow frisks.
 */
export function AutoFriskClient({ abstract }: Props) {
  const [state, formAction, pending] = useActionState(
    friskAction,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!submittedRef.current && formRef.current) {
      submittedRef.current = true;
      formRef.current.requestSubmit();
    }
  }, []);

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="hidden">
        <textarea name="input" defaultValue={abstract} readOnly />
      </form>

      {(state.status === "idle" || pending) && (
        <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center">
          <div
            aria-hidden="true"
            className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-primary"
          />
          <p className="mt-4 text-sm text-ink/70">Frisking the abstract…</p>
          <p className="mt-1 text-xs text-ink/50">
            This usually takes 10 to 20 seconds.
          </p>
        </div>
      )}

      {state.status === "ok" && (
        <ScoreCardView card={state.card} cached={state.cached} />
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
