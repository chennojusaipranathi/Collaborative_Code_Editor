import { Router } from "express";
import { createRoom, joinRoom, listMyRooms, getRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createRoomSchema, joinRoomSchema } from "../utils/validators.js";

const router = Router();

router.use(protect); // every room route needs a logged-in user

router.get("/", listMyRooms);
router.post("/", validate(createRoomSchema), createRoom);
router.post("/join", validate(joinRoomSchema), joinRoom);
router.get("/:roomId", getRoom);

export default router;