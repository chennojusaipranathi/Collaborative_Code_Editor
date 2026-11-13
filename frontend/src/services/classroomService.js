import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;

// Returns { room: { id, name, locked }, task, students }
export function getClassroom(roomId) {
  return request(`/api/rooms/${roomId}/classroom`, { token: token() });
}

export async function setLocked(roomId, locked) {
  await request(`/api/rooms/${roomId}/lock`, { method: "PATCH", body: { locked }, token: token() });
  return locked;
}