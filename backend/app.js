import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Allow only our frontend to call this API
app.use(cors({ origin: env.clientUrl }));

// Let Express read JSON request bodies
app.use(express.json());

// Health check: now also reports the database state
app.get("/api/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1; // 1 means connected
  res.status(200).json({
    status: "ok",
    service: "codesync-backend",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

// Must be registered after all routes
app.use(errorHandler);



// Connect to the database first, then start accepting requests
await connectDB();

app.listen(env.port, () => {
  console.log(`CodeSync backend running on http://localhost:${env.port}`);
});