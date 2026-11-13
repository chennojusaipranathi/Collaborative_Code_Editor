// In-memory: roomId -> Set(userId) of students with a raised hand
const hands = new Map();

export function getHands(roomId) {
  return [...(hands.get(String(roomId)) ?? [])];
}

export function setHand(roomId, userId, raised) {
  const key = String(roomId);
  if (!hands.has(key)) hands.set(key, new Set());
  const set = hands.get(key);
  if (raised) set.add(String(userId));
  else set.delete(String(userId));
  if (set.size === 0) hands.delete(key);
}