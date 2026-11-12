import { Router } from "express";
import {
  createRoom, joinRoom, listMyRooms, getRoom, listParticipants, changeRole,
} from "../controllers/roomController.js";
import { runCode, listRuns } from "../controllers/executionController.js";
import { createInvite, listInvites, revokeInvite } from "../controllers/inviteController.js";
import fileRoutes from "./fileRoutes.js";
import messageRoutes from "./messageRoutes.js";
import snapshotRoutes from "./snapshotRoutes.js";
import { protect } from "../middleware/auth.js";
import { requireRoomRole } from "../middleware/roomAccess.js";
import { runLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  createRoomSchema, joinRoomSchema, runSchema, changeRoleSchema, createInviteSchema,
} from "../utils/validators.js";

const router = Router();

router.use(protect); // every room route needs a logged-in user

router.get("/", listMyRooms);
router.post("/", validate(createRoomSchema), createRoom);
router.post("/join", validate(joinRoomSchema), joinRoom);
router.get("/:roomId", getRoom);

router.get("/:roomId/participants", requireRoomRole("viewer"), listParticipants);
router.patch("/:roomId/participants/:userId", requireRoomRole("owner"), validate(changeRoleSchema), changeRole);

router.post("/:roomId/run", requireRoomRole("editor"), runLimiter, validate(runSchema), runCode);
router.get("/:roomId/runs", requireRoomRole("viewer"), listRuns);

router.post("/:roomId/invites", requireRoomRole("owner"), validate(createInviteSchema), createInvite);
router.get("/:roomId/invites", requireRoomRole("owner"), listInvites);
router.delete("/:roomId/invites/:inviteId", requireRoomRole("owner"), revokeInvite);

router.use("/:roomId/messages", messageRoutes);
router.use("/:roomId/files/:fileId/snapshots", snapshotRoutes); // before /files
router.use("/:roomId/files", fileRoutes);

export default router;