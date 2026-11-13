import * as Y from "yjs";
import RoomParticipant from "../models/RoomParticipant.js";
import { getDoc, markDirty, watch, unwatch } from "./docStore.js";
import { getRoomRules, getFileOwner, canReadFile, canWriteFile } from "../utils/fileAccess.js";

// `joined` is the set of room ids this socket joined (from index.js).
// Returns a cleanup function to call on disconnect.
export function registerYjsHandlers(socket, joined) {
  const user = socket.data.user;
  const watching = new Set(); // "roomId:fileId" pairs this socket has open

  // Loaded fresh each time, so role changes apply immediately
  async function roleIn(roomId) {
    const m = await RoomParticipant.findOne({ room: roomId, user: user.id });
    return m?.role ?? null;
  }

  socket.on("yjs:sync", async ({ roomId, fileId }, ack) => {
    try {
      if (!joined.has(roomId)) throw new Error("Join the room first");

      const role = await roleIn(roomId);
      if (!role) throw new Error("Room not found");
      const room = await getRoomRules(roomId);
      const owner = await getFileOwner(roomId, fileId);
      // Same message as a missing file, so ids can't be probed
      if (!canReadFile(room, role, user.id, { owner })) throw new Error("File not found");

      const doc = await getDoc(roomId, fileId);
      watch(roomId, fileId, socket.id);
      watching.add(`${roomId}:${fileId}`);
      ack?.({ ok: true, state: Y.encodeStateAsUpdate(doc) });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  // The client closed a file (switched tabs)
  socket.on("yjs:unsync", ({ roomId, fileId }) => {
    if (watching.delete(`${roomId}:${fileId}`)) unwatch(roomId, fileId, socket.id);
  });

  socket.on("yjs:update", async ({ roomId, fileId, update }, ack) => {
    try {
      if (!joined.has(roomId)) throw new Error("Join the room first");

      const role = await roleIn(roomId);
      if (!role) throw new Error("Room not found");
      const room = await getRoomRules(roomId);
      const owner = await getFileOwner(roomId, fileId);
      if (!canWriteFile(room, role, user.id, { owner })) {
        throw new Error("You cannot edit this file right now");
      }

      const doc = await getDoc(roomId, fileId);
      Y.applyUpdate(doc, new Uint8Array(update), "client");
      markDirty(roomId, fileId, user.name);

      socket.to(roomId).emit("yjs:update", { fileId, update });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on("awareness:update", ({ roomId, fileId, update }) => {
    if (!joined.has(roomId)) return;
    socket.to(roomId).emit("awareness:update", { fileId, update });
  });

  socket.on("awareness:query", ({ roomId, fileId }) => {
    if (!joined.has(roomId)) return;
    socket.to(roomId).emit("awareness:query", { fileId });
  });

  return function cleanup() {
    for (const pair of watching) {
      const [roomId, fileId] = pair.split(":");
      unwatch(roomId, fileId, socket.id);
    }
    watching.clear();
  };
}