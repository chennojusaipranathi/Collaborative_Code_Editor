// In-memory presence: roomId -> Map(socketId -> { id, name, fileId })
const rooms = new Map();

export function addToRoom(roomId, socketId, user) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  rooms.get(roomId).set(socketId, { ...user, fileId: null });
}

export function removeFromRoom(roomId, socketId) {
  const members = rooms.get(roomId);
  if (!members) return;
  members.delete(socketId);
  if (members.size === 0) rooms.delete(roomId);
}

// Remember which file this socket is looking at (null = none)
export function setFile(roomId, socketId, fileId) {
  const member = rooms.get(roomId)?.get(socketId);
  if (member) member.fileId = fileId;
}

// Unique online users, each with the file they have open
export function getOnlineUsers(roomId) {
  const members = rooms.get(roomId);
  if (!members) return [];
  const unique = new Map();
  for (const user of members.values()) unique.set(user.id, user);
  return [...unique.values()];
}