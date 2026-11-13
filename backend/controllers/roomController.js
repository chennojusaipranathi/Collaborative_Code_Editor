import crypto from "crypto";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import File from "../models/File.js";
import { STARTER_FILES } from "../utils/starterFiles.js";
import { notifyRoomChanged } from "../sockets/io.js";
import { clearRules } from "../utils/fileAccess.js";


// Random 6-character code, e.g. "K7QX2M". Letters that look alike are left out.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode() {
  return Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
}

// The shape the frontend receives
function publicRoom(room, myRole, participants) {
  return {
    id: room._id,
    name: room.name,
    code: room.code,
    mode: room.mode,
    language: room.language,
    participants,
    myRole,
    lastEdited: room.updatedAt,
    locked: room.locked ?? false,
  };
}

export async function createRoom(req, res) {
  const { name, mode, language } = req.body;

  // Backend rule: only teachers may create Classroom or Exam rooms
  if (mode !== "free" && req.user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can create classroom or exam rooms" });
  }

  // Retry in the rare case the random code is already taken
  let room;
  for (let attempt = 0; attempt < 5 && !room; attempt++) {
    try {
      room = await Room.create({ name, mode, language, code: makeCode(), owner: req.user.id });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  if (!room) return res.status(500).json({ message: "Could not generate a room code. Try again." });

  await RoomParticipant.create({ room: room._id, user: req.user.id, role: "owner" });
    const starter = STARTER_FILES[language];
  await File.create({ room: room._id, name: starter.name, content: starter.content, createdBy: req.user.id });

  res.status(201).json({ room: publicRoom(room, "owner", 1) });
}

export async function joinRoom(req, res) {
  const room = await Room.findOne({ code: req.body.code });
  if (!room) return res.status(404).json({ message: "No room found with that code" });

  const existing = await RoomParticipant.findOne({ room: room._id, user: req.user.id });
  if (existing) return res.status(409).json({ message: "You are already in this room" });
  
  // Joining as a student in a classroom or exam makes you an editor; free rooms too
  await RoomParticipant.create({ room: room._id, user: req.user.id, role: "editor" });
    notifyRoomChanged(room._id);

  const count = await RoomParticipant.countDocuments({ room: room._id });
  res.status(201).json({ room: publicRoom(room, "editor", count) });
}

export async function listMyRooms(req, res) {
  const memberships = await RoomParticipant.find({ user: req.user.id })
    .populate("room")
    .sort({ updatedAt: -1 });

  const rooms = [];
  for (const m of memberships) {
    if (!m.room) continue; // room was deleted
    const count = await RoomParticipant.countDocuments({ room: m.room._id });
    rooms.push(publicRoom(m.room, m.role, count));
  }
  rooms.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));

  res.json({ rooms });
}

export async function getRoom(req, res) {
  const { roomId } = req.params;

  // A malformed id would crash the query, so check it first
  if (!mongoose.isValidObjectId(roomId)) {
    return res.status(404).json({ message: "Room not found" });
  }

  const membership = await RoomParticipant.findOne({ room: roomId, user: req.user.id }).populate("room");
  // Same message whether the room doesn't exist or you aren't in it
  if (!membership || !membership.room) {
    return res.status(404).json({ message: "Room not found" });
  }

  const count = await RoomParticipant.countDocuments({ room: roomId });
  res.json({ room: publicRoom(membership.room, membership.role, count) });
}

export async function listParticipants(req, res) {
  const members = await RoomParticipant.find({ room: req.params.roomId })
    .populate("user", "name")
    .sort({ createdAt: 1 });

  res.json({
    participants: members
      .filter((m) => m.user)
      .map((m) => ({ id: m.user._id, name: m.user.name, role: m.role, online: false })),
  });
}


export async function changeRole(req, res) {
  const { roomId, userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(404).json({ message: "Participant not found" });
  }
  // The owner cannot demote themselves, or the room would have no owner
  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const member = await RoomParticipant.findOneAndUpdate(
    { room: roomId, user: userId },
    { $set: { role: req.body.role } },
     { returnDocument: "after" }
  );
  if (!member) return res.status(404).json({ message: "Participant not found" });
    notifyRoomChanged(roomId);

  res.json({ participant: { id: userId, role: member.role } });
}

export async function setLocked(req, res) {
  const { roomId } = req.params;
  const room = await Room.findById(roomId).select("mode");
  if (!room || room.mode !== "classroom") {
    return res.status(400).json({ message: "Only classroom rooms can be locked" });
  }

  // timestamps: false keeps "last edited" about code, not about locking
  await Room.updateOne({ _id: roomId }, { $set: { locked: req.body.locked } }, { timestamps: false });
  clearRules(roomId); // apply to live editing immediately
  notifyRoomChanged(roomId); // open editors reload and become read-only
  res.json({ locked: req.body.locked });
}