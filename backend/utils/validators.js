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

const fileName = z
  .string()
  .trim()
  .min(1, "File name is required")
  .max(100, "File name is too long")
  .regex(/^[\w\-. ]+$/, "Use only letters, numbers, dots, dashes and underscores");

export const createFileSchema = z.object({ name: fileName });

export const updateFileSchema = z
  .object({
    name: fileName.optional(),
    content: z.string().max(200000, "File is too large").optional(),
  })
  .refine((d) => d.name !== undefined || d.content !== undefined, {
    message: "Nothing to update",
  });
  
  export const runSchema = z.object({
  fileName: z.string().trim().min(1).max(100),
  code: z.string().max(100000, "Code is too large to run"),
  stdin: z.string().max(10000, "Input is too large").default(""),
});

export const createSnapshotSchema = z.object({
  label: z.string().trim().min(1, "Give the snapshot a label").max(80, "Label is too long"),
});