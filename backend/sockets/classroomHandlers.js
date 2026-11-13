import mongoose from "mongoose";
import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import { getHands, setHand } from "./hands.js";

export function registerClassroomHandlers(io, socket, joined) {
  const user = socket.data.user;

  const broadcast = (roomId) =>
    io.to(roomId).emit("classroom:hands", { roomId, userIds: getHands(roomId) });

  // A client asks who has a raised hand right now
  socket.on("hand:sync", ({ roomId }, ack) => {
    if (!joined.has(roomId)) return ack?.({ ok: false });
    ack?.({ ok: true, userIds: getHands(roomId) });
  });

  // A student raises or lowers their own hand
  socket.on("hand:raise", async ({ roomId, raised }, ack) => {
    try {
      if (!joined.has(roomId)) throw new Error("Join the room first");
      const member = await RoomParticipant.findOne({ room: roomId, user: user.id });
      const room = await Room.findById(roomId).select("mode").lean();
      if (!member || member.role === "owner" || room?.mode !== "classroom") {
        throw new Error("Not allowed");
      }
      setHand(roomId, user.id, Boolean(raised));
      broadcast(roomId);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  // Only the teacher (room owner) can dismiss someone's hand
  socket.on("hand:dismiss", async ({ roomId, userId }, ack) => {
    try {
      if (!joined.has(roomId)) throw new Error("Join the room first");
      if (!mongoose.isValidObjectId(userId)) throw new Error("Invalid student");
      const member = await RoomParticipant.findOne({ room: roomId, user: user.id });
      if (member?.role !== "owner") throw new Error("Only the teacher can do this");
      setHand(roomId, userId, false);
      broadcast(roomId);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });
}