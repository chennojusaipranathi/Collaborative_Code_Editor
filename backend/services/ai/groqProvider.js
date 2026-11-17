export async function ask(input) {
  const args = typeof input === "string" ? { prompt: input } : input ?? {};
  const prompt = args.prompt ?? args.question ?? args.message ?? args.text ?? args.content;
  const system = args.system ?? args.systemPrompt;
  const maxTokens = args.maxTokens ?? 4000;

  if (!prompt || typeof prompt !== "string") {
    console.error("askAI received:", JSON.stringify(input));
    throw new Error("askAI called without a text prompt");
  }
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
  if (!process.env.GROQ_MODEL) throw new Error("GROQ_MODEL is not set");

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      reasoning_effort: "low",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${err.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content;

  if (!text || !text.trim()) {
    console.error("Empty AI reply:", JSON.stringify(data).slice(0, 800));
    throw new Error(`AI returned an empty answer (finish_reason: ${choice?.finish_reason})`);
  }
  return text;
}