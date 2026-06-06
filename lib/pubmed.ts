/**
 * NCBI E-utilities client for PubMed search and abstract retrieval.
 *
 * Two surfaces:
 *  - searchPubMed(q):  esearch + esummary → light metadata for tile rendering
 *  - fetchPubMedAbstract(pmid): efetch → plain-text abstract for the engine
 *
 * NCBI_API_KEY is read from the environment if present (raises the rate limit
 * from 3 req/s to 10 req/s); the public endpoint also works without one.
 *
 * Errors are logged and the helpers degrade gracefully (return [] / null).
 * Server-side only.
 */

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export type PubMedResult = {
  pmid: string;
  title: string;
  journal: string; // short form (e.g., "N Engl J Med")
  year: string;
  authors: string[]; // up to 3 last-first author labels
};

function withApiKey(url: URL): URL {
  const key = process.env.NCBI_API_KEY;
  if (key) url.searchParams.set("api_key", key);
  return url;
}

/**
 * Live search PubMed by keyword. Returns up to `limit` results in
 * PubMed's relevance order. [] on any failure.
 */
export async function searchPubMed(
  query: string,
  limit = 10,
): Promise<PubMedResult[]> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. esearch -> list of PMIDs in relevance order
    const searchUrl = withApiKey(new URL(`${NCBI_BASE}/esearch.fcgi`));
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", trimmed);
    searchUrl.searchParams.set("retmax", String(limit));
    searchUrl.searchParams.set("retmode", "json");
    searchUrl.searchParams.set("sort", "relevance");

    const searchRes = await fetch(searchUrl.toString(), { cache: "no-store" });
    if (!searchRes.ok) {
      console.error("[pubmed] esearch HTTP", searchRes.status);
      return [];
    }
    const searchJson = (await searchRes.json()) as {
      esearchresult?: { idlist?: string[] };
    };
    const ids = searchJson?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    // 2. esummary -> metadata for those PMIDs
    const summaryUrl = withApiKey(new URL(`${NCBI_BASE}/esummary.fcgi`));
    summaryUrl.searchParams.set("db", "pubmed");
    summaryUrl.searchParams.set("id", ids.join(","));
    summaryUrl.searchParams.set("retmode", "json");

    const summaryRes = await fetch(summaryUrl.toString(), {
      cache: "no-store",
    });
    if (!summaryRes.ok) {
      console.error("[pubmed] esummary HTTP", summaryRes.status);
      return [];
    }
    const summaryJson = (await summaryRes.json()) as {
      result?: Record<string, unknown>;
    };
    const result = summaryJson?.result;
    if (!result || typeof result !== "object") return [];

    // Preserve relevance order from esearch.
    const out: PubMedResult[] = [];
    for (const pmid of ids) {
      const entry = result[pmid];
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const title = typeof e.title === "string" ? e.title : "";
      if (!title) continue;
      const journal = typeof e.source === "string" ? e.source : "";
      const pubdate = typeof e.pubdate === "string" ? e.pubdate : "";
      const year = pubdate.match(/\d{4}/)?.[0] ?? "";
      const authorsRaw = Array.isArray(e.authors) ? e.authors : [];
      const authors: string[] = [];
      for (const a of authorsRaw.slice(0, 3)) {
        if (a && typeof a === "object" && "name" in a) {
          const n = (a as { name: unknown }).name;
          if (typeof n === "string" && n) authors.push(n);
        }
      }
      out.push({ pmid, title, journal, year, authors });
    }
    return out;
  } catch (err) {
    console.error("[pubmed] searchPubMed threw:", err);
    return [];
  }
}

/**
 * Fetch a PubMed record as plain-text abstract (rettype=abstract,
 * retmode=text). Returns the trimmed text or null on failure.
 *
 * The returned text contains the citation header, title, authors,
 * affiliations, abstract, DOI, and PMID — suitable to feed straight
 * into the frisk engine without further parsing.
 */
export async function fetchPubMedAbstract(
  pmid: string,
): Promise<string | null> {
  try {
    const url = withApiKey(new URL(`${NCBI_BASE}/efetch.fcgi`));
    url.searchParams.set("db", "pubmed");
    url.searchParams.set("id", pmid);
    url.searchParams.set("rettype", "abstract");
    url.searchParams.set("retmode", "text");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error("[pubmed] efetch HTTP", res.status);
      return null;
    }
    const text = (await res.text()).trim();
    return text || null;
  } catch (err) {
    console.error("[pubmed] fetchPubMedAbstract threw:", err);
    return null;
  }
}
