import { env } from "../../config/env.js";
import { buildPrompt } from "./prompts.js";

export async function ask(request) {
  const { system, user } = buildPrompt(request);

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.aiModel,
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    throw new Error(err.name === "TimeoutError" ? "The AI took too long to answer" : "Cannot reach the AI service");
  }

  if (!response.ok) {
    // Never forward the provider's raw message: it could contain details about our account
    console.error("AI provider error", response.status);
    if (response.status === 401 || response.status === 403) throw new Error("The AI service is not configured correctly");
    if (response.status === 429) throw new Error("The AI service is busy. Try again in a moment");
    throw new Error("The AI service returned an error");
  }

  const data = await response.json();
  const answer = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!answer) throw new Error("The AI returned an empty answer");
  return { answer, provider: "anthropic" };
}