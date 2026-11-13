import Message from "../models/Message.js";
import { getRoomRules } from "../utils/fileAccess.js";

export function publicMessage(m) {
  return {
    id: m._id,
    senderId: String(m.sender),
    senderName: m.senderName,
    text: m.text,
    createdAt: m.createdAt,
  };
}

export async function listMessages(req, res) {
    const rules = await getRoomRules(req.params.roomId);
  if (rules?.mode === "exam" && req.membership.role !== "owner") return res.json({ messages: [] });
  const messages = await Message.find({ room: req.params.roomId })
    .sort({ createdAt: -1 })
    .limit(50);
  // We fetched newest first to get the LAST 50; reverse so the UI reads top to bottom
  res.json({ messages: messages.reverse().map(publicMessage) });
}