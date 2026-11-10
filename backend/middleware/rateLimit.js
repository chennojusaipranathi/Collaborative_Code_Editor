import rateLimit from "express-rate-limit";

// Login and register: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

// Everything else under /api: 300 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Slow down." },
});

// Running code is expensive: 10 runs per minute per logged-in user
export const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user.id, // runs after `protect`, so req.user exists
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You are running code too fast. Wait a moment." },
});