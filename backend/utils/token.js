import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// The token carries only the user id and role. It expires in 7 days.
export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: "7d",
  });
}