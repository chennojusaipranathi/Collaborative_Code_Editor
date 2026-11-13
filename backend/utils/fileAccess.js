import File from "../models/File.js";
import Room from "../models/Room.js";

// ---- room rules (mode and lock), cached for one second so every keystroke is not a query ----
const rulesCache = new Map(); // roomId -> { at, room }

export async function getRoomRules(roomId) {
  const key = String(roomId);
  const hit = rulesCache.get(key);
  if (hit && Date.now() - hit.at < 1000) return hit.room;
  const room = await Room.findById(key).select("mode locked").lean();
  rulesCache.set(key, { at: Date.now(), room });
  return room;
}

// Called when the teacher locks or unlocks, so the change applies at once
export function clearRules(roomId) {
  rulesCache.delete(String(roomId));
}

// ---- who owns a file (it never changes, so it is cached) ----
const owners = new Map(); // "roomId:fileId" -> userId or null

export async function getFileOwner(roomId, fileId) {
  const key = `${roomId}:${fileId}`;
  if (owners.has(key)) return owners.get(key);
  const file = await File.findOne({ _id: fileId, room: roomId }).select("owner").lean();
  if (!file) throw new Error("File not found");
  const owner = file.owner ? String(file.owner) : null;
  owners.set(key, owner);
  return owner;
}

// In a classroom, students can read their own file and shared files.
// In an exam, students never read room files (they work only in their exam session).
export function canReadFile(room, role, userId, file) {
  if (role === "owner") return true;
  if (room?.mode === "exam") return false;
  if (room?.mode !== "classroom") return true;
  return !file.owner || String(file.owner) === String(userId);
}

// Viewers never write. In a classroom, students write only their own file, and only while unlocked.
export function canWriteFile(room, role, userId, file) {
  if (role === "viewer") return false;
  if (role === "owner") return true;
  if (room?.mode === "exam") return false;
  if (room?.mode !== "classroom") return true;
  return !room.locked && Boolean(file.owner) && String(file.owner) === String(userId);
}