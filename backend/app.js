import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Behind Render's proxy, req.ip would be the proxy's address for everyone.
// Trusting one proxy hop makes the rate limits count real clients.
if (env.isProduction) app.set("trust proxy", 1);

// Safe default headers (also removes X-Powered-By)
app.use(
  helmet({
    // The frontend lives on another origin and reads our JSON with CORS
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Only the listed frontends may call this API from a browser
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header means it is not a browser page (curl, tests, health checks)
      if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false); // no CORS headers, so the browser blocks the response
    },
  })
);

// Read JSON bodies, but refuse huge ones
app.use(express.json({ limit: "1mb" }));

// Health check: reports database state (not rate limited, monitors call it)
app.get("/api/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "ok",
    service: "codesync-backend",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/invites", inviteRoutes);

// These two must come last, in this order
app.use(notFound);
app.use(errorHandler);

export default app;