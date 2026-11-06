// REAL room service. Same function names as the old mock.
import { request } from "./api";
import { loadSession } from "./authService";

function token() {
  return loadSession()?.token;
}

export async function getRooms() {
  const data = await request("/api/rooms", { token: token() });
  return data.rooms;
}

export async function createRoom({ name, mode, language }) {
  const data = await request("/api/rooms", {
    method: "POST",
    body: { name, mode, language },
    token: token(),
  });
  return data.room;
}

export async function joinRoom(code) {
  const data = await request("/api/rooms/join", {
    method: "POST",
    body: { code },
    token: token(),
  });
  return data.room;
}

export async function getRoom(roomId) {
  const data = await request(`/api/rooms/${roomId}`, { token: token() });
  return data.room;
}