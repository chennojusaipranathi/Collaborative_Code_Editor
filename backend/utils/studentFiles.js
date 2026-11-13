import File from "../models/File.js";
import User from "../models/User.js";
import { STARTER_FILES } from "./starterFiles.js";
import { notifyRoomChanged } from "../sockets/io.js";

// Gives a student their own file in a classroom (created once, then reused).
// `room` needs _id, mode and language. Tells open editors only when a NEW file is made.
export async function ensureStudentFile(room, userId) {
  if (room.mode !== "classroom") return null;

  const existing = await File.findOne({ room: room._id, owner: userId });
  if (existing) return existing;

  const user = await User.findById(userId).select("name");
  const starter = STARTER_FILES[room.language] ?? STARTER_FILES.JavaScript;
  const ext = starter.name.split(".").pop();
  const base = (user?.name ?? "student").replace(/[^\w-]/g, "_").slice(0, 40) || "student";

  // Try "name.ext", then "name_1a2b.ext" if that name is taken
  for (const name of [`${base}.${ext}`, `${base}_${String(userId).slice(-4)}.${ext}`]) {
    try {
      const file = await File.create({
        room: room._id, name, content: starter.content, createdBy: userId, owner: userId,
      });
      // The file exists now, so open editors can reload and see it
      notifyRoomChanged(room._id);
      return file;
    } catch (err) {
      if (err.code !== 11000) throw err;
      // Two requests at once may have created it already
      const again = await File.findOne({ room: room._id, owner: userId });
      if (again) return again;
    }
  }
  return null;
}