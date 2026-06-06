"use server";

import { normalizeStudyKey, saveCard } from "@/lib/cards";
import { RANDOM_TOPIC_POOL, type NextCardResult } from "@/lib/play";
import { fetchPubMedAbstract, searchPubMedIds } from "@/lib/pubmed";
import { friskStudy } from "@/lib/scoring";
import { isLockedTopic, isProUser } from "@/lib/upgrade";

/**
 * Pull one fresh PubMed-sourced card for the Play feed.
 *
 * Flow: pick a query (the user's topic, or random from RANDOM_TOPIC_POOL),
 * esearch at a random offset for variety, pick the first PMID not in
 * `seenPmids`, efetch its abstract, frisk it, cache it, return.
 *
 * Three offset attempts before declaring the topic exhausted. Errors are
 * surfaced as a typed result rather than thrown — the client renders an
 * error panel and offers retry.
 */
export async function nextPubMedCard(
  topic: string | undefined,
  seenPmids: string[],
): Promise<NextCardResult> {
  // Server-side Pro gate so a typed-in URL like /play?topic=Statins can't
  // bypass the UI's locked-pill rendering.
  if (isLockedTopic(topic) && !(await isProUser())) {
    return {
      status: "error",
      message: "This topic is Pro. Upgrade in Settings to unlock.",
    };
  }

  try {
    const trimmedTopic = topic?.trim();
    const query =
      trimmedTopic && trimmedTopic.length > 0
        ? trimmedTopic
        : RANDOM_TOPIC_POOL[
            Math.floor(Math.random() * RANDOM_TOPIC_POOL.length)
          ];

    const seenSet = new Set(seenPmids);
    let pmid: string | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const offset = Math.floor(Math.random() * 200);
      const ids = await searchPubMedIds(query, offset, 20);
      const fresh = ids.filter((id) => !seenSet.has(id));
      if (fresh.length > 0) {
        pmid = fresh[Math.floor(Math.random() * fresh.length)];
        break;
      }
    }

    if (!pmid) {
      return {
        status: "exhausted",
        message: "No fresh studies left for this query.",
      };
    }

    const abstract = await fetchPubMedAbstract(pmid);
    if (!abstract) {
      return {
        status: "error",
        message: "Couldn't load that PubMed record. Try the next one.",
      };
    }

    const studyKey = normalizeStudyKey(abstract);
    const engineOutput = await friskStudy(abstract);

    await saveCard(studyKey, engineOutput);

    return {
      status: "ok",
      card: {
        ...engineOutput,
        study_key: studyKey,
        pmid,
      },
    };
  } catch (err) {
    console.error("[play/actions] nextPubMedCard threw:", err);
    return {
      status: "error",
      message: "Frisk engine had trouble. Try again.",
    };
  }
}
