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

const isProduction = process.env.NODE_ENV === "production";

// CLIENT_URL may hold several origins, separated by commas. No trailing slash.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// In production the server refuses to start with unsafe settings
if (isProduction) {
  const secret = process.env.JWT_SECRET;
  if (secret.length < 32 || /change-me|secret|password/i.test(secret)) {
    console.error("JWT_SECRET is too weak for production. Use at least 32 random characters.");
    process.exit(1);
  }
  if (!process.env.CLIENT_URL) {
    console.error("CLIENT_URL must be set in production (your frontend's address).");
    process.exit(1);
  }
  for (const origin of allowedOrigins) {
    const local = /^http:\/\/localhost(:\d+)?$/.test(origin);
    if (!origin.startsWith("https://") && !local) {
      console.error(`CLIENT_URL origin must use https in production: ${origin}`);
      process.exit(1);
    }
  }
}

// One place that reads process.env. The rest of the app imports `env`.
export const env = {
  port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  allowedOrigins,
  clientUrl: allowedOrigins[0], // used for invite links
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
    executionProvider: process.env.EXECUTION_PROVIDER || "judge0", // "judge0" or "mock"
  judge0Url: process.env.JUDGE0_URL || "https://ce.judge0.com",
  judge0Token: process.env.JUDGE0_AUTH_TOKEN || "", // only for hosts that need a key
    aiProvider: process.env.AI_PROVIDER || "mock", // "mock" or "anthropic"
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  aiModel: process.env.AI_MODEL || "claude-sonnet-5-5",
  
};