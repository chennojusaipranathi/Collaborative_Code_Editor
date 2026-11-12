import { Router } from "express";
import { previewInvite, acceptInvite } from "../controllers/inviteController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/:token", previewInvite);
router.post("/:token/accept", acceptInvite);

export default router;