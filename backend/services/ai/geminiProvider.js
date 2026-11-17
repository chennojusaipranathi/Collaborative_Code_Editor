const MODEL = process.env.GEMINI_MODEL; // required, see note below
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ask(input) {
  // Accept a plain string or an object with a few common field names
  const args = typeof input === "string" ? { prompt: input } : input ?? {};
  const prompt = args.prompt ?? args.question ?? args.message ?? args.text ?? args.content;
  const system = args.system ?? args.systemPrompt;
  const maxTokens = args.maxTokens ?? 1000;

  if (!prompt || typeof prompt !== "string") {
    console.error("askAI received:", JSON.stringify(input));
    throw new Error("askAI called without a text prompt");
  }

  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  if (!MODEL) throw new Error("GEMINI_MODEL is not set");

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${BASE}/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    // Free tier hits 429 easily: back off with jitter and retry
    if (res.status === 429 && attempt < 2) {
      await sleep(2000 * 2 ** attempt + Math.random() * 500);
      continue;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini ${res.status}: ${err.error?.message ?? res.statusText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini returned no text (possibly blocked by safety filters)");
    return text;
  }
}