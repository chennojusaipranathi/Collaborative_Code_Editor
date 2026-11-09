import mongoose from "mongoose";
import File from "../models/File.js";
import Room from "../models/Room.js";
import { dropDoc } from "../sockets/docStore.js";

function publicFile(file) {
  return { id: file._id, name: file.name, content: file.content };
}

const DUPLICATE = { message: "A file with this name already exists" };

export async function listFiles(req, res) {
  const files = await File.find({ room: req.params.roomId }).sort({ createdAt: 1 });
  res.json({ files: files.map(publicFile) });
}

export async function createFile(req, res) {
  try {
    const file = await File.create({
      room: req.params.roomId,
      name: req.body.name,
      createdBy: req.user.id,
    });
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

  if (req.body.name !== undefined) file.name = req.body.name;
  if (req.body.content !== undefined) file.content = req.body.content;

  try {
    await file.save();
  } catch (err) {
    if (err.code === 11000) return res.status(409).json(DUPLICATE);
    throw err;
  }

  // Keep the room's "last edited" time fresh when code changes
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

  const result = await File.deleteOne({ _id: fileId, room: roomId });
  if (result.deletedCount === 0)
  {
      dropDoc(roomId, fileId);
     return res.status(404).json({ message: "File not found" });
  }

  res.json({ message: "File deleted" });
}