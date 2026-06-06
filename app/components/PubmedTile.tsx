import Link from "next/link";
import type { PubMedResult } from "@/lib/pubmed";

type Props = { result: PubMedResult };

export function PubmedTile({ result }: Props) {
  const friskHref = `/frisk?pubmed_id=${encodeURIComponent(result.pmid)}`;
  const meta = [result.journal, result.year].filter(Boolean).join(" · ");
  const authorsLabel =
    result.authors.length > 0
      ? result.authors.slice(0, 3).join(", ") +
        (result.authors.length > 3 ? ", et al." : "")
      : "";

  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-accent uppercase">
            PubMed
          </span>
          <span className="text-xs text-ink/60">PMID {result.pmid}</span>
        </div>
        <h3 className="text-base leading-tight font-semibold text-ink sm:text-lg">
          {result.title}
        </h3>
        {meta && <p className="text-xs text-ink/60">{meta}</p>}
        {authorsLabel && <p className="text-xs text-ink/60">{authorsLabel}</p>}
      </div>
      <div className="mt-4">
        <Link
          href={friskHref}
          className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Frisk it
        </Link>
      </div>
    </article>
  );
}
