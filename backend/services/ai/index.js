import * as gemini from "./geminiProvider.js";
import * as openai from "./openaiProvider.js";
import * as groq from "./groqProvider.js";
import { buildRequest } from "./prompt.js";

const providers = { gemini, openai, groq };

export async function askAI(input) {
  const name = process.env.AI_PROVIDER || "groq";
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown AI_PROVIDER: ${name}`);

  const { system, prompt } = buildRequest(input);
  if (!prompt) throw new Error("Nothing to send: no question or code provided");

  const answer = await provider.ask({ system, prompt });
  return { answer, provider: name };
}