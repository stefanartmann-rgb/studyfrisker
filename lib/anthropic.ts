import Anthropic from "@anthropic-ai/sdk";

/**
 * Generic server-side helper for calling the Anthropic Messages API.
 *
 * Reads ANTHROPIC_API_KEY from the environment and uses the
 * claude-sonnet-4-6 model. Returns the model's text response as a string.
 *
 * Server-side only — never import this into client components, or the API
 * key would be exposed to the browser.
 */

const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

function getClient(): Anthropic {
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
 * Send a system prompt and a user message to Claude and return the text reply.
 */
export async function callModel(
  systemPrompt: string,
  userMessage: string,
  options: CallModelOptions = {},
): Promise<string> {
  const response = await getClient().messages.create({
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
