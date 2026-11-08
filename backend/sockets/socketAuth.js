import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../models/User.js";

// Runs once for every new connection. Calling next(error) refuses the connection.
export async function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Not logged in"));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!mongoose.isValidObjectId(payload.id)) return next(new Error("Invalid token"));

    const user = await User.findById(payload.id);
    if (!user) return next(new Error("Account no longer exists"));

    // socket.data is per-connection storage, readable in every handler
    socket.data.user = { id: String(user._id), name: user.name, role: user.role };
    next();
  } catch {
    next(new Error("Session expired"));
  }
}