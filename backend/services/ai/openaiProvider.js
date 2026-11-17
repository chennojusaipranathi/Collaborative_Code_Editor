const MODEL = process.env.OPENAI_MODEL; // e.g. a small, cheap model from your OpenAI dashboard

export async function ask(input) {
  const args = typeof input === "string" ? { prompt: input } : input ?? {};
  const prompt = args.prompt ?? args.question ?? args.message ?? args.text ?? args.content;
  const system = args.system ?? args.systemPrompt;
  const maxTokens = args.maxTokens ?? 1000;

  if (!prompt || typeof prompt !== "string") {
    console.error("askAI received:", JSON.stringify(input));
    throw new Error("askAI called without a text prompt");
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  if (!MODEL) throw new Error("OPENAI_MODEL is not set");

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI ${res.status}: ${err.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}