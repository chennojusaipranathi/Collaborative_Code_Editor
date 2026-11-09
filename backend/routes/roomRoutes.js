import { Router } from "express";
import {
  createRoom, joinRoom, listMyRooms, getRoom, listParticipants,
} from "../controllers/roomController.js";
import fileRoutes from "./fileRoutes.js";
import { protect } from "../middleware/auth.js";
import { requireRoomRole } from "../middleware/roomAccess.js";
import { validate } from "../middleware/validate.js";
import { createRoomSchema, joinRoomSchema } from "../utils/validators.js";
import messageRoutes from "./messageRoutes.js";

const router = Router();

router.use(protect); // every room route needs a logged-in user

router.get("/", listMyRooms);
router.post("/", validate(createRoomSchema), createRoom);
router.post("/join", validate(joinRoomSchema), joinRoom);
router.get("/:roomId", getRoom);
router.get("/:roomId/participants", requireRoomRole("viewer"), listParticipants);
router.use("/:roomId/files", fileRoutes);
router.use("/:roomId/messages", messageRoutes);


export default router;