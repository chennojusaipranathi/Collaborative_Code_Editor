import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["student", "teacher"]).default("student"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60),
  mode: z.enum(["free", "classroom", "exam"]).default("free"),
  language: z.enum(["JavaScript", "TypeScript", "Python", "Java", "C++"]).default("JavaScript"),
});

export const joinRoomSchema = z.object({
  code: z.string().trim().toUpperCase().length(6, "Room code must be 6 characters"),
});