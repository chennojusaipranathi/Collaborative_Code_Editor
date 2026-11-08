import { Router } from "express";
import { listFiles, createFile, updateFile, deleteFile } from "../controllers/fileController.js";
import { requireRoomRole } from "../middleware/roomAccess.js";
import { validate } from "../middleware/validate.js";
import { createFileSchema, updateFileSchema } from "../utils/validators.js";

// mergeParams lets this router see :roomId from the parent route
const router = Router({ mergeParams: true });

router.get("/", requireRoomRole("viewer"), listFiles);
router.post("/", requireRoomRole("editor"), validate(createFileSchema), createFile);
router.patch("/:fileId", requireRoomRole("editor"), validate(updateFileSchema), updateFile);
router.delete("/:fileId", requireRoomRole("editor"), deleteFile);

export default router;