import { env } from "../_generated/server";

// Defaults target Gemini's OpenAI-compatible endpoint (a free API key from
// aistudio.google.com/apikey, no billing required) so the app works without
// OpenAI. Any OpenAI-compatible provider works by overriding LLM_BASE_URL /
// LLM_MODEL / LLM_API_KEY.
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_MODEL = "gemini-3.6-flash";

export async function chatJSON(
  messages: { role: "system" | "user"; content: string }[],
): Promise<string> {
  if (!env.LLM_API_KEY) {
    throw new Error("LLM_API_KEY is not set. Run `npx convex env set LLM_API_KEY <key>`.");
  }
  const baseUrl = env.LLM_BASE_URL ?? DEFAULT_BASE_URL;
  const model = env.LLM_MODEL ?? DEFAULT_MODEL;

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
  if (!res.ok) {
    throw new Error(`LLM call failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message.content ?? "{}";
}
