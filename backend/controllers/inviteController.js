import crypto from "crypto";
import mongoose from "mongoose";
import Invite from "../models/Invite.js";
import RoomParticipant from "../models/RoomParticipant.js";
import { env } from "../config/env.js";
import { notifyRoomChanged } from "../sockets/io.js";


function publicInvite(i) {
  return {
    id: i._id,
    role: i.role,
    expiresAt: i.expiresAt,
    uses: i.uses,
    link: `${env.clientUrl}/join/${i.token}`,
  };
}

const INVALID = { message: "This invite link is invalid or has expired" };
// Higher number = more power
const RANK = { viewer: 1, editor: 2, owner: 3 };
// ---- Owner endpoints (under /api/rooms/:roomId/invites) ----

export async function createInvite(req, res) {
  const { role, expiresInHours } = req.body;
  const invite = await Invite.create({
    room: req.params.roomId,
    token: crypto.randomBytes(24).toString("base64url"), // unguessable
    role,
    createdBy: req.user.id,
    expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000),
  });
  res.status(201).json({ invite: publicInvite(invite) });
}

export async function listInvites(req, res) {
  const invites = await Invite.find({
    room: req.params.roomId,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  res.json({ invites: invites.map(publicInvite) });
}

export async function revokeInvite(req, res) {
  const { roomId, inviteId } = req.params;
  if (!mongoose.isValidObjectId(inviteId)) return res.status(404).json({ message: "Invite not found" });
  const result = await Invite.deleteOne({ _id: inviteId, room: roomId });
  if (result.deletedCount === 0) return res.status(404).json({ message: "Invite not found" });
  res.json({ message: "Invite revoked" });
}

// ---- Guest endpoints (under /api/invites/:token) ----

async function findValid(token) {
  const invite = await Invite.findOne({ token, expiresAt: { $gt: new Date() } }).populate("room");
  return invite?.room ? invite : null;
}

export async function previewInvite(req, res) {
  const invite = await findValid(req.params.token);
  if (!invite) return res.status(404).json(INVALID);

  const existing = await RoomParticipant.findOne({ room: invite.room._id, user: req.user.id });

  res.json({
    room: { name: invite.room.name, mode: invite.room.mode },
    role: invite.role,
    myRole: existing?.role ?? null,
    // true when the link would give an existing member MORE access
    upgrade: Boolean(existing && RANK[invite.role] > RANK[existing.role]),
  });
}

export async function acceptInvite(req, res) {
  const invite = await findValid(req.params.token);
  if (!invite) return res.status(404).json(INVALID);

  const roomId = String(invite.room._id);
  const existing = await RoomParticipant.findOne({ room: roomId, user: req.user.id });

  if (existing) {
    // Links can only ADD access. Never downgrade, and never touch an owner.
    if (RANK[invite.role] > RANK[existing.role]) {
      existing.role = invite.role;
      await existing.save();
      await Invite.updateOne({ _id: invite._id }, { $inc: { uses: 1 } });
      notifyRoomChanged(roomId);
      return res.json({ roomId, role: existing.role, alreadyMember: true, upgraded: true });
    }
    return res.json({ roomId, role: existing.role, alreadyMember: true, upgraded: false });
  }

  try {
    await RoomParticipant.create({ room: roomId, user: req.user.id, role: invite.role });
  } catch (err) {
    if (err.code !== 11000) throw err; // two clicks at once: already joined, fine
  }
  await Invite.updateOne({ _id: invite._id }, { $inc: { uses: 1 } });
  notifyRoomChanged(roomId);
  res.status(201).json({ roomId, role: invite.role, alreadyMember: false, upgraded: false });
}