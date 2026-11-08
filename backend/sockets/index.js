import { Server } from "socket.io";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import RoomParticipant from "../models/RoomParticipant.js";
import { socketAuth } from "./socketAuth.js";
import { addToRoom, removeFromRoom, getOnlineUsers } from "./presence.js";

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl }, // same rule as the REST API
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    // Rooms this socket joined, so we can clean up on disconnect
    const joined = new Set();

    const broadcastPresence = (roomId) => {
      io.to(roomId).emit("presence:update", getOnlineUsers(roomId));
    };

    socket.on("room:join", async (roomId, ack) => {
      try {
        if (!mongoose.isValidObjectId(roomId)) throw new Error("Room not found");

        // Authorization: the DATABASE decides, never the client
        const membership = await RoomParticipant.findOne({ room: roomId, user: user.id });
        if (!membership) throw new Error("Room not found");

        socket.join(roomId);
        joined.add(roomId);
        addToRoom(roomId, socket.id, { id: user.id, name: user.name });

        broadcastPresence(roomId);
        ack?.({ ok: true, role: membership.role, online: getOnlineUsers(roomId) });
      } catch (err) {
        ack?.({ ok: false, message: err.message });
      }
    });

    socket.on("room:leave", (roomId) => {
      if (!joined.has(roomId)) return;
      socket.leave(roomId);
      joined.delete(roomId);
      removeFromRoom(roomId, socket.id);
      broadcastPresence(roomId);
    });

    // "disconnect" fires for closed tabs, lost network, and server restarts
    socket.on("disconnect", () => {
      for (const roomId of joined) {
        removeFromRoom(roomId, socket.id);
        broadcastPresence(roomId);
      }
    });
  });

  return io;
}