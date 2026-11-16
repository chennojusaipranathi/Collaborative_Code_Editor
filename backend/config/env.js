// IMPORTANT: this import must come first. It loads .env into process.env.
import "dotenv/config";

// The app cannot work without these, so stop immediately with a clear message
const required = ["MONGODB_URI", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in backend/.env`);
    process.exit(1);
  }
}

// One place that reads process.env. The rest of the app imports `env`.
export const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
    executionProvider: process.env.EXECUTION_PROVIDER || "judge0", // "judge0" or "mock"
  judge0Url: process.env.JUDGE0_URL || "https://ce.judge0.com",
  judge0Token: process.env.JUDGE0_AUTH_TOKEN || "", // only for hosts that need a key
    aiProvider: process.env.AI_PROVIDER || "mock", // "mock" or "anthropic"
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  aiModel: process.env.AI_MODEL || "claude-sonnet-5-5",
  
};