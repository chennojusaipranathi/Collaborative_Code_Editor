import { Router } from "express";
import {
  listSnapshots, getSnapshot, createSnapshot, restoreSnapshot,
} from "../controllers/snapshotController.js";
import { requireRoomRole } from "../middleware/roomAccess.js";
import { validate } from "../middleware/validate.js";
import { createSnapshotSchema } from "../utils/validators.js";

// mergeParams exposes :roomId and :fileId from the parent path
const router = Router({ mergeParams: true });

router.get("/", requireRoomRole("viewer"), listSnapshots);
router.post("/", requireRoomRole("editor"), validate(createSnapshotSchema), createSnapshot);
router.get("/:snapshotId", requireRoomRole("viewer"), getSnapshot);
router.post("/:snapshotId/restore", requireRoomRole("editor"), restoreSnapshot);

export default router;