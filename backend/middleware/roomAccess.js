import mongoose from "mongoose";
import RoomParticipant from "../models/RoomParticipant.js";

// Higher number = more power
const RANK = { viewer: 1, editor: 2, owner: 3 };

// Usage: requireRoomRole("editor"). Must come AFTER protect.
export function requireRoomRole(minRole) {
  return async (req, res, next) => {
    const { roomId } = req.params;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await RoomParticipant.findOne({ room: roomId, user: req.user.id });

    // Not a member: same answer as "room doesn't exist"
    if (!membership) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (RANK[membership.role] < RANK[minRole]) {
      return res.status(403).json({ message: "Your role in this room does not allow this" });
    }

    req.membership = membership;
    next();
  };
}