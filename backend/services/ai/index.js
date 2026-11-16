import { env } from "../../config/env.js";
import * as anthropic from "./anthropicProvider.js";
import * as mock from "./mockProvider.js";

const providers = { anthropic, mock };

// The only function the rest of the app calls
export function askAI(request) {
  const provider = providers[env.aiProvider];
  if (!provider) throw new Error(`Unknown AI_PROVIDER: ${env.aiProvider}`);
  if (env.aiProvider === "anthropic" && !env.anthropicKey) {
    throw new Error("The AI is not configured on the server yet");
  }
  return provider.ask(request);
}