import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Allow only our frontend to call this API
app.use(cors({ origin: env.clientUrl }));

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

// These two must come last, in this order
app.use(notFound);
app.use(errorHandler);

await connectDB();

app.listen(env.port, () => {
  console.log(`CodeSync backend running on http://localhost:${env.port}`);
});