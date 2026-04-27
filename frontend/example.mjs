import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Node does not read .env.local automatically (Vite does for the dev server).
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.local"), override: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing API key. Add OPENAI_API_KEY=sk-... to .env.local (or .env)."
  );
}

const client = new OpenAI({ apiKey });

const response = await client.responses.create({
  model: "gpt-5.4",
  input: "Write a one-sentence bedtime story about a unicorn.",
});

console.log(response.output_text);
