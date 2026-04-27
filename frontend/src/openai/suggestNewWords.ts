import { fetchOpenAIText } from "./responsesCommon";

export type VocabularyEntry = { word: string; translation: string };

export async function fetchSuggestedNewWords(
  apiKey: string,
  sample: VocabularyEntry[],
  signal: AbortSignal
): Promise<string> {
  const lines = sample
    .map((w) => `${w.word} — ${w.translation}`)
    .join("\n");

  const input = `The learner studies English with Ukrainian translations. Here are ${sample.length} words already in their vocabulary (English — Ukrainian), one per line:

${lines}

Based on this sample (level, topics, and gaps), suggest 12–18 NEW English words they might want to learn next, with Ukrainian translations. Rules:
- Do not repeat or trivially rephrase any word from the list above.
- Mix useful everyday and slightly more advanced vocabulary.
- Output a clear numbered list. Each line: number. English word or phrase — Ukrainian translation
- No introduction or closing commentary.`;

  return fetchOpenAIText(apiKey, input, signal);
}
