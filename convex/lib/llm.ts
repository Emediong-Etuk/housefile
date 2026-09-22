import { env } from "../_generated/server";

// Defaults target Gemini's OpenAI-compatible endpoint (a free API key from
// aistudio.google.com/apikey, no billing required) so the app works without
// OpenAI. Any OpenAI-compatible provider works by overriding LLM_BASE_URL /
// LLM_MODEL / LLM_API_KEY.
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_MODEL = "gemini-3.6-flash";

// Free-tier Gemini returns 429/503 under load fairly often — transient, not
// a real failure. Retry a few times with backoff before surfacing an error.
// Empirically ~2 of every 3 calls hit 503 right now, so 4 attempts still had
// a real chance of exhausting themselves — bumped to 5.
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
        // Gemini 3's "thinking" mode adds real latency for these tasks
        // (extraction/classification, not deep reasoning) — asking for
        // minimal effort roughly halves response time when it doesn't hit
        // the free-tier overload above. Harmless if a future provider
        // ignores the field.
        reasoning_effort: "minimal",
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
