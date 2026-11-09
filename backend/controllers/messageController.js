import Message from "../models/Message.js";

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
  const messages = await Message.find({ room: req.params.roomId })
    .sort({ createdAt: -1 })
    .limit(50);
  // We fetched newest first to get the LAST 50; reverse so the UI reads top to bottom
  res.json({ messages: messages.reverse().map(publicMessage) });
}