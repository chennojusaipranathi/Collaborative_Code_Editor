import mongoose from "mongoose";
import File from "../models/File.js";
import User from "../models/User.js";
import VersionSnapshot from "../models/VersionSnapshot.js";
import { currentContent, replaceContent } from "../sockets/docStore.js";
import { getIO } from "../sockets/io.js";

function publicSnapshot(s, withContent = false) {
  return {
    id: s._id,
    label: s.label,
    type: s.type,
    author: s.authorName,
    createdAt: s.createdAt,
    ...(withContent ? { content: s.content } : {}),
  };
}

// Finds the file, and only if it belongs to this room
async function findFile(req) {
  const { roomId, fileId } = req.params;
  if (!mongoose.isValidObjectId(fileId)) return null;
  return File.findOne({ _id: fileId, room: roomId });
}

async function findSnapshot(req, file) {
  if (!mongoose.isValidObjectId(req.params.snapshotId)) return null;
  return VersionSnapshot.findOne({ _id: req.params.snapshotId, file: file._id });
}

const NOT_FOUND = { message: "File not found" };

export async function listSnapshots(req, res) {
  const file = await findFile(req);
  if (!file) return res.status(404).json(NOT_FOUND);

  // The list leaves out `content`, so it stays small
  const snapshots = await VersionSnapshot.find({ file: file._id })
    .select("-content")
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({
    file: { id: file._id, name: file.name },
    current: await currentContent(req.params.roomId, file._id),
    snapshots: snapshots.map((s) => publicSnapshot(s)),
  });
}

export async function getSnapshot(req, res) {
  const file = await findFile(req);
  if (!file) return res.status(404).json(NOT_FOUND);
  const snapshot = await findSnapshot(req, file);
  if (!snapshot) return res.status(404).json({ message: "Snapshot not found" });
  res.json({ snapshot: publicSnapshot(snapshot, true) });
}

export async function createSnapshot(req, res) {
  const file = await findFile(req);
  if (!file) return res.status(404).json(NOT_FOUND);

  const user = await User.findById(req.user.id);
  // Content comes from the server's own copy, never from the client
  const content = await currentContent(req.params.roomId, file._id);

  const snapshot = await VersionSnapshot.create({
    room: file.room,
    file: file._id,
    fileName: file.name,
    label: req.body.label,
    type: "manual",
    author: req.user.id,
    authorName: user?.name ?? "Unknown",
    content: content ?? "",
  });

  res.status(201).json({ snapshot: publicSnapshot(snapshot) });
}

export async function restoreSnapshot(req, res) {
  const file = await findFile(req);
  if (!file) return res.status(404).json(NOT_FOUND);
  const snapshot = await findSnapshot(req, file);
  if (!snapshot) return res.status(404).json({ message: "Snapshot not found" });

  const user = await User.findById(req.user.id);
  const before = (await currentContent(req.params.roomId, file._id)) ?? "";

  // Safety net: keep the current text before overwriting it
  const backup = await VersionSnapshot.create({
    room: file.room,
    file: file._id,
    fileName: file.name,
    label: `Backup before restoring "${snapshot.label}"`,
    type: "backup",
    author: req.user.id,
    authorName: user?.name ?? "Unknown",
    content: before,
  });

  // Update the live document, and tell everyone who has the file open
  const update = await replaceContent(req.params.roomId, file._id, snapshot.content);
  if (update) {
    getIO()?.to(req.params.roomId).emit("yjs:update", { fileId: String(file._id), update });
  }

  res.json({ restored: publicSnapshot(snapshot), backup: publicSnapshot(backup) });
}