import * as Y from "yjs";
import RoomParticipant from "../models/RoomParticipant.js";
import { getDoc } from "./docStore.js";

// Registers the Yjs events for one connected socket.
// `joined` is the set of room ids this socket has joined (from index.js).
export function registerYjsHandlers(socket, joined) {
  const user = socket.data.user;

  // Loads the role fresh each time, so role changes apply immediately
  async function roleIn(roomId) {
    const m = await RoomParticipant.findOne({ room: roomId, user: user.id });
    return m?.role ?? null;
  }

  // Client opens a file: send the current full state
  socket.on("yjs:sync", async ({ roomId, fileId }, ack) => {
    try {
      if (!joined.has(roomId)) throw new Error("Join the room first");
      const doc = await getDoc(roomId, fileId);
      ack?.({ ok: true, state: Y.encodeStateAsUpdate(doc) });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  // Client edited: apply to the server copy, then relay to everyone else
  socket.on("yjs:update", async ({ roomId, fileId, update }, ack) => {
    try {
      if (!joined.has(roomId)) throw new Error("Join the room first");

      // Viewers may read but never write
      const role = await roleIn(roomId);
      if (!role || role === "viewer") throw new Error("You cannot edit in this room");

      const doc = await getDoc(roomId, fileId);
      Y.applyUpdate(doc, new Uint8Array(update), "client");

      // socket.to(...) sends to everyone in the room EXCEPT the sender
      socket.to(roomId).emit("yjs:update", { fileId, update });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });
}