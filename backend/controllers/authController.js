import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

// The shape the frontend receives. Never includes the password hash.
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function register(req, res) {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });

  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  // select("+passwordHash") asks for the field we hid with select: false
  const user = await User.findOne({ email }).select("+passwordHash");

  // Same message for "no such email" and "wrong password", so attackers can't
  // find out which emails are registered
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ user: publicUser(user), token: signToken(user) });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: "Account no longer exists" });
  }
  res.json({ user: publicUser(user) });
}