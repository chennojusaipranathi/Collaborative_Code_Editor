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
import { runLimiter,examLimiter } from "../middleware/rateLimit.js";
import { validate} from "../middleware/validate.js";
import {
  createRoomSchema, joinRoomSchema, runSchema, changeRoleSchema, createInviteSchema,lockSchema,taskSchema,examSchema, openSchema, saveSessionSchema, eventSchema, submitSessionSchema, gradeSchema
} from "../utils/validators.js";

import { setLocked } from "../controllers/roomController.js";

import { getClassroom } from "../controllers/classroomController.js";
import { getTask, saveTask, deleteTask, submitTask, listSubmissions } from "../controllers/taskController.js";
import {
  getExam, saveExam, setExamOpen, deleteExam, startExam, saveSession, recordEvent,
  submitSession, listSessions, getSession, gradeSession,similarity
} from "../controllers/examController.js";


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
router.get("/:roomId/classroom", requireRoomRole("owner"), getClassroom);
router.patch("/:roomId/lock", requireRoomRole("owner"), validate(lockSchema), setLocked);

router.get("/:roomId/task", requireRoomRole("viewer"), getTask);
router.put("/:roomId/task", requireRoomRole("owner"), validate(taskSchema), saveTask);
router.delete("/:roomId/task", requireRoomRole("owner"), deleteTask);
router.post("/:roomId/task/submit", requireRoomRole("editor"), submitTask);
router.get("/:roomId/submissions", requireRoomRole("owner"), listSubmissions);

router.get("/:roomId/exam", requireRoomRole("viewer"), getExam);
router.put("/:roomId/exam", requireRoomRole("owner"), validate(examSchema), saveExam);
router.patch("/:roomId/exam/open", requireRoomRole("owner"), validate(openSchema), setExamOpen);
router.delete("/:roomId/exam", requireRoomRole("owner"), deleteExam);
router.get("/:roomId/exam/sessions", requireRoomRole("owner"), listSessions);
router.get("/:roomId/exam/sessions/:studentId", requireRoomRole("owner"), getSession);
router.patch("/:roomId/exam/sessions/:studentId/grade", requireRoomRole("owner"), validate(gradeSchema), gradeSession);
router.post("/:roomId/exam/start", requireRoomRole("editor"), examLimiter, startExam);
router.put("/:roomId/exam/session", requireRoomRole("editor"), examLimiter, validate(saveSessionSchema), saveSession);
router.post("/:roomId/exam/session/event", requireRoomRole("editor"), examLimiter, validate(eventSchema), recordEvent);
router.post("/:roomId/exam/session/submit", requireRoomRole("editor"), examLimiter, validate(submitSessionSchema), submitSession);
router.get("/:roomId/exam/similarity", requireRoomRole("owner"), similarity);

export default router;