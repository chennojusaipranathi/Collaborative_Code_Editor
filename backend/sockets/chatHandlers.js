import Message from "../models/Message.js";
import { publicMessage } from "../controllers/messageController.js";

const MAX_LENGTH = 1000;
const MIN_GAP_MS = 400; // at most about 2 messages per second per connection

export function registerChatHandlers(io, socket, joined) {
  const user = socket.data.user;
  let lastSent = 0;

  socket.on("chat:send", async ({ roomId, text }, ack) => {
    try {
      // Membership: the socket must have joined (the DB check happened in room:join)
      if (!joined.has(roomId)) throw new Error("Join the room first");

      if (typeof text !== "string") throw new Error("Invalid message");
      const clean = text.trim();
      if (!clean) throw new Error("Message is empty");
      if (clean.length > MAX_LENGTH) throw new Error("Message is too long");

      const now = Date.now();
      if (now - lastSent < MIN_GAP_MS) throw new Error("You are sending too fast");
      lastSent = now;

      const message = await Message.create({
        room: roomId,
        sender: user.id,
        senderName: user.name,
        text: clean,
      });

      // Everyone in the room, including the sender
      io.to(roomId).emit("chat:message", { roomId, message: publicMessage(message) });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

    // Relay only. Nothing is stored. Name comes from the verified token, not the client.
  socket.on("chat:typing", ({ roomId }) => {
    if (!joined.has(roomId)) return;
    socket.to(roomId).emit("chat:typing", { roomId, userId: user.id, name: user.name });
  });
}