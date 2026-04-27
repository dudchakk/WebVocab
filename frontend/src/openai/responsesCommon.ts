export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export const OPENAI_DEFAULT_MODEL = "gpt-5.4";

export function extractOutputText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const d = data as Record<string, unknown>;
  if (typeof d.output_text === "string") return d.output_text;

  const output = d.output;
  if (!Array.isArray(output)) return "";

  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part !== "object" || part === null) continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.length > 0) return text;
    }
  }
  return "";
}

export async function fetchOpenAIText(
  apiKey: string,
  input: string,
  signal: AbortSignal,
  model: string = OPENAI_DEFAULT_MODEL
): Promise<string> {
  const res = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || res.statusText);
  }

  const data: unknown = await res.json();
  const text = extractOutputText(data).trim();
  if (!text) {
    throw new Error("Empty model response");
  }
  return text;
}
