import { request } from "./api";
import { loadSession } from "./authService";

// action: "explain" | "bugs" | "improve" | "ask". Returns { answer, provider }.
export function askAssistant(roomId, { action, fileName, code, question }) {
  return request(`/api/rooms/${roomId}/ai`, {
    method: "POST",
    body: { action, fileName, code, question },
    token: loadSession()?.token,
  });
}