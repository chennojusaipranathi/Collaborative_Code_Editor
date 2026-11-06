import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { protect, requireRole } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../utils/validators.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);

// Temporary route to test role checks. We remove it later.
router.get("/teacher-check", protect, requireRole("teacher"), (_req, res) => {
  res.json({ message: "You are a teacher" });
});

export default router;