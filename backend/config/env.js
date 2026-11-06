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
};