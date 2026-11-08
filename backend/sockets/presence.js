// In-memory presence: roomId -> Map(socketId -> { id, name })
// One user with two tabs open has two sockets, so we count by socket and
// de-duplicate by user id when reporting.
const rooms = new Map();

export function addToRoom(roomId, socketId, user) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  rooms.get(roomId).set(socketId, user);
}

export function removeFromRoom(roomId, socketId) {
  const members = rooms.get(roomId);
  if (!members) return;
  members.delete(socketId);
  if (members.size === 0) rooms.delete(roomId); // clean up empty rooms
}

// List of unique online users in a room
export function getOnlineUsers(roomId) {
  const members = rooms.get(roomId);
  if (!members) return [];
  const unique = new Map();
  for (const user of members.values()) unique.set(user.id, user);
  return [...unique.values()];
}