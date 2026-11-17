import rateLimit from "express-rate-limit";

// Automated tests send many requests quickly, so limits are off in test mode only
const skip = () => process.env.NODE_ENV === "test";

// Login and register: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

// Everything else under /api: 300 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Slow down." },
});

// Running code is expensive: 10 runs per minute per logged-in user
export const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skip,
  keyGenerator: (req) => req.user.id, // runs after `protect`, so req.user exists
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You are running code too fast. Wait a moment." },
});

// Exam saves, events and submits: 120 per minute per logged-in user
export const examLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  skip,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Slow down." },
});

// AI calls cost money: 8 per minute per logged-in user
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  skip,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You are asking the assistant too fast. Wait a moment." },
});