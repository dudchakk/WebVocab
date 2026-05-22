import { fetchOpenAIText } from "./responsesCommon";

export type VocabularyEntry = { word: string; translation: string };

export async function fetchSuggestedNewWords(
  apiKey: string,
  sample: VocabularyEntry[],
  signal: AbortSignal
): Promise<string> {
  const lines = sample
    .map((w) => `${w.word} - ${w.translation}`)
    .join("\n");

  const input = `You are an AI assistant for a vocabulary learning application.

You are given a list of words that the user is currently learning.
This list is a mixed sample:
- some words are recent
- some words are randomly selected from older vocabulary

User vocabulary:
${lines}

---

Your task is to:

1. Estimate the user's vocabulary level based on:
- complexity of words
- variety of topics
- parts of speech usage
- overall vocabulary depth

Do not assume user is beginner, infer level from data.

---

2. Analyze the vocabulary:

- Identify main topics
- Analyze balance of parts of speech (nouns, verbs, adjectives, etc.)
- Detect gaps:
  - missing functional and useful verbs from the topics
  - missing connectors, useful everyday expressions, sentence-building vocabulary

---

3. Provide a short insight (1-2 sentences, in ukrainian):

- Summarize the user's vocabulary level and structure
- Highlight ONE key improvement opportunity

---

4. Provide a short explanation (1-2 sentences, in ukrainian):

- Explain why the suggested words are useful for this specific user

---

5. Suggest new words:

- Provide up to 30 words total

Word selection strategy:
- 70% of words should match the user's estimated level and vocabulary topics
- 30% should be slightly more advanced or broader vocabulary (stretch zone)

Rules:
- Prefer practical and commonly used vocabulary
- Include advanced relevant to existing topics and user level

Avoid:
- irrelevant niche domains
- overly rare or obscure vocabulary

---

6. For EACH word:

Provide:
- English word
- Ukrainian translation

---

7. Output format (strict JSON):

{
  "insight": "...",
  "explanation": "...",
  "words": [
    {
      "word": "example",
      "translation": "приклад"
    }
  ]
}

---

Important:
- Do not include duplicates
- Do not add text outside JSON
- Do not assume beginner level
- Adapt difficulty dynamically to the user's vocabulary`;

  return fetchOpenAIText(apiKey, input, signal);
}
