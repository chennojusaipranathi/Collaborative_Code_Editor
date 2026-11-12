let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}

// Tells every open editor in the room to reload its member list and its own role
export function notifyRoomChanged(roomId) {
  io?.to(String(roomId)).emit("room:changed", { roomId: String(roomId) });
}