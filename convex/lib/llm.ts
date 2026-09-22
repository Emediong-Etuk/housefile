import { env } from "../_generated/server";

// Defaults target Gemini's OpenAI-compatible endpoint (a free API key from
// aistudio.google.com/apikey, no billing required) so the app works without
// OpenAI. Any OpenAI-compatible provider works by overriding LLM_BASE_URL /
// LLM_MODEL / LLM_API_KEY.
//
// gemini-3.6-flash (a "thinking" model) was the original default but proved
// unreliable on the free tier for these tasks: its hidden reasoning tokens
// roughly tripled response time even on success (measured ~470 vs ~190
// total tokens for the same prompt), and it hit 429/503 on a majority of
// calls under light, bursty use. gemini-flash-lite-latest is a plain
// (non-thinking) model — same JSON-extraction quality for this app's
// classification/extraction tasks, consistently sub-second, and held up
// through 6/6 back-to-back calls with zero rate-limit errors in testing.
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_MODEL = "gemini-flash-lite-latest";

// Free tier can still return 429/503 under real load — transient, not a
// real failure. Retry a few times with backoff before surfacing an error.
const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chatJSON(
  messages: { role: "system" | "user"; content: string }[],
): Promise<string> {
  if (!env.LLM_API_KEY) {
    throw new Error("LLM_API_KEY is not set. Run `npx convex env set LLM_API_KEY <key>`.");
  }
  const baseUrl = env.LLM_BASE_URL ?? DEFAULT_BASE_URL;
  const model = env.LLM_MODEL ?? DEFAULT_MODEL;

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages,
      }),
    });
    if (res.ok) {
      const json = (await res.json()) as { choices: { message: { content: string } }[] };
      return json.choices[0]?.message.content ?? "{}";
    }
    lastError = `LLM call failed (${res.status}): ${await res.text()}`;
    if (!RETRYABLE_STATUS.has(res.status) || attempt === MAX_ATTEMPTS) {
      throw new Error(lastError);
    }
    await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
  }
  throw new Error(lastError);
}
