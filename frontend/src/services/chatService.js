import { request } from "./api";
import { loadSession } from "./authService";

export async function getMessages(roomId) {
  const data = await request(`/api/rooms/${roomId}/messages`, { token: loadSession()?.token });
  return data.messages;
}