import { Router } from "express";
import { listMessages } from "../controllers/messageController.js";
import { requireRoomRole } from "../middleware/roomAccess.js";

const router = Router({ mergeParams: true });

router.get("/", requireRoomRole("viewer"), listMessages);

export default router;