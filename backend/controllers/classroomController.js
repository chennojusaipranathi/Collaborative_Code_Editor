import File from "../models/File.js";
import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import { ensureStudentFile } from "../utils/studentFiles.js";
import { getOnlineUsers } from "../sockets/presence.js";
import { peekContent } from "../sockets/docStore.js";
import { getHands } from "../sockets/hands.js";
import { publicTask } from "./taskController.js";

const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // edited in the last 2 minutes = coding
const PREVIEW_CHARS = 600;

export async function getClassroom(req, res) {
  const { roomId } = req.params;
  const room = await Room.findById(roomId).select("name mode language locked");
  if (!room || room.mode !== "classroom") {
    return res.status(400).json({ message: "This room is not a classroom" });
  }

  const members = await RoomParticipant.find({ room: roomId, role: { $ne: "owner" } })
    .populate("user", "name")
    .sort({ createdAt: 1 });

  // Every student editor gets a file, even if they have not opened the room yet
  await Promise.all(
    members.filter((m) => m.user && m.role === "editor").map((m) => ensureStudentFile(room, m.user._id))
  );

  const task = await Task.findOne({ room: roomId });
  const submissions = task ? await Submission.find({ task: task._id }).select("student submittedAt") : [];
  const submittedBy = new Map(submissions.map((s) => [String(s.student), s]));

  const files = await File.find({ room: roomId, owner: { $ne: null } }).select("name content owner updatedAt");
  const byOwner = new Map(files.map((f) => [String(f.owner), f]));
  const online = new Set(getOnlineUsers(roomId).map((u) => u.id));
  const hands = new Set(getHands(roomId));

  const students = members
    .filter((m) => m.user)
    .map((m) => {
      const id = String(m.user._id);
      const file = byOwner.get(id);
      const submission = submittedBy.get(id);
      // Live text if the file is open right now, otherwise the saved text
      const text = (file && peekContent(roomId, String(file._id))) ?? file?.content ?? "";

      let status = "offline";
      if (online.has(id)) {
        status = file && Date.now() - file.updatedAt.getTime() < ACTIVE_WINDOW_MS ? "coding" : "idle";
      }
      if (submission) status = "submitted";

      return {
        id,
        name: m.user.name,
        role: m.role,
        status,
        handRaised: hands.has(id),
        fileId: file ? String(file._id) : null,
        code: text.slice(0, PREVIEW_CHARS),
        lastActive: file ? file.updatedAt : null,
        submittedAt: submission ? submission.submittedAt : null,
      };
    });

  res.json({
    room: { id: String(room._id), name: room.name, locked: room.locked },
    task: task ? publicTask(task) : null,
    students,
  });
}