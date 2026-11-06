import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Runs before protected routes. Expects the header: Authorization: Bearer <token>
export function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret); // throws if fake or expired
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

// Usage: requireRole("teacher"). Must come AFTER protect.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }
    next();
  };
}