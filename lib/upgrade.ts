import { cookies } from "next/headers";

/**
 * Pro-state helpers.
 *
 * No auth, no user records — Pro state is a single httpOnly cookie
 * (studyfrisker_pro=1). Set after a successful Mollie test-mode payment;
 * read by Settings and Play to gate features. Plenty for the hackathon
 * demo, would need real session-bound state for production.
 */

const COOKIE_NAME = "studyfrisker_pro";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Play topics available without Pro. Random (no topic param) is
 * implicitly free — only `Vitamin D` is free among the curated pills.
 */
export const FREE_PLAY_TOPICS = ["Vitamin D"];

export async function isProUser(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export async function setProCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * True if the topic is a Pro-gated category. Random (undefined topic)
 * and the topics in FREE_PLAY_TOPICS are unlocked for everyone.
 */
export function isLockedTopic(topic: string | undefined): boolean {
  if (!topic) return false;
  const normalized = topic.trim().toLowerCase();
  if (!normalized) return false;
  return !FREE_PLAY_TOPICS.some((free) => free.toLowerCase() === normalized);
}
