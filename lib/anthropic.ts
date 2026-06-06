import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic SDK helpers.
 *
 * Reads ANTHROPIC_API_KEY from the environment. Server-side only — never
 * import this into client components, or the API key would be exposed to
 * the browser.
 */

export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

/**
 * Lazily-constructed singleton Anthropic client. Throws at first call if
 * ANTHROPIC_API_KEY is missing.
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing environment variable: ANTHROPIC_API_KEY");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export interface CallModelOptions {
  /** Upper bound on output tokens. Defaults to 4096. */
  maxTokens?: number;
}

/**
 * Generic text-in / text-out helper. Sends a system prompt and a user
 * message to Claude and returns the text reply.
 */
export async function callModel(
  systemPrompt: string,
  userMessage: string,
  options: CallModelOptions = {},
): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
