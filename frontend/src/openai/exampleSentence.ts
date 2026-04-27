import { fetchOpenAIText } from "./responsesCommon";

export async function fetchExampleSentenceForWord(
  apiKey: string,
  word: string,
  languageLabel: string,
  signal: AbortSignal
): Promise<string> {
  return fetchOpenAIText(
    apiKey,
    `Write exactly one natural example sentence in ${languageLabel} that uses the word "${word}" in a typical, learner-friendly way. Output only the sentence, no quotes or explanation.`,
    signal
  );
}
