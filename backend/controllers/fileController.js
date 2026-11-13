import mongoose from "mongoose";
import File from "../models/File.js";
import Room from "../models/Room.js";
import VersionSnapshot from "../models/VersionSnapshot.js";
import { dropDoc } from "../sockets/docStore.js";
import { getRoomRules, canWriteFile } from "../utils/fileAccess.js";
import { ensureStudentFile } from "../utils/studentFiles.js";
import { notifyRoomChanged } from "../sockets/io.js";

function publicFile(file) {
  return {
    id: file._id,
    name: file.name,
    content: file.content,
    owner: file.owner ? String(file.owner) : null,
  };
}

const DUPLICATE = { message: "A file with this name already exists" };
const FORBIDDEN = { message: "You cannot change this file right now" };

export async function listFiles(req, res) {
  const { roomId } = req.params;
  const role = req.membership.role;
  const room = await Room.findById(roomId).select("mode language").lean();
  const classroomStudent = room?.mode === "classroom" && role !== "owner";

  // Every student editor gets a personal file the first time they open the room
  if (classroomStudent && role === "editor") await ensureStudentFile(room, req.user.id);

  // Students see shared files and their own, never other students' files
  const filter = classroomStudent
    ? { room: roomId, $or: [{ owner: null }, { owner: req.user.id }] }
    : { room: roomId };

  const files = await File.find(filter).sort({ createdAt: 1 });
  res.json({ files: files.map(publicFile) });
}

export async function createFile(req, res) {
  const room = await getRoomRules(req.params.roomId);
  // In a classroom only the teacher manages files
  if (room?.mode === "classroom" && req.membership.role !== "owner") {
    return res.status(403).json({ message: "Only the teacher can create files in a classroom" });
  }

  try {
    const file = await File.create({
      room: req.params.roomId,
      name: req.body.name,
      createdBy: req.user.id,
    });
        notifyRoomChanged(req.params.roomId);
    res.status(201).json({ file: publicFile(file) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json(DUPLICATE);
    throw err;
  }
}

export async function updateFile(req, res) {
  const { roomId, fileId } = req.params;
  if (!mongoose.isValidObjectId(fileId)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Looking up by BOTH ids stops anyone editing a file that belongs to another room
  const file = await File.findOne({ _id: fileId, room: roomId });
  if (!file) return res.status(404).json({ message: "File not found" });

  const room = await getRoomRules(roomId);
  if (!canWriteFile(room, req.membership.role, req.user.id, file)) {
    return res.status(403).json(FORBIDDEN);
  }

  if (req.body.name !== undefined) file.name = req.body.name;
  if (req.body.content !== undefined) file.content = req.body.content;

  try {
    await file.save();
  } catch (err) {
    if (err.code === 11000) return res.status(409).json(DUPLICATE);
    throw err;
  }

  if (req.body.content !== undefined) {
    await Room.updateOne({ _id: roomId }, { $set: { updatedAt: new Date() } });
  }

  res.json({ file: publicFile(file) });
}

export async function deleteFile(req, res) {
  const { roomId, fileId } = req.params;
  if (!mongoose.isValidObjectId(fileId)) {
    return res.status(404).json({ message: "File not found" });
  }

  const file = await File.findOne({ _id: fileId, room: roomId });
  if (!file) return res.status(404).json({ message: "File not found" });

  const room = await getRoomRules(roomId);
  if (!canWriteFile(room, req.membership.role, req.user.id, file)) {
    return res.status(403).json(FORBIDDEN);
  }

  await File.deleteOne({ _id: fileId });
  dropDoc(roomId, fileId);
  await VersionSnapshot.deleteMany({ file: fileId });
      notifyRoomChanged(req.params.roomId);
  res.json({ message: "File deleted" });
}