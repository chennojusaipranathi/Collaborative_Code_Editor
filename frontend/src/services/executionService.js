import { request } from "./api";
import { loadSession } from "./authService";

export async function runCode(roomId, { fileName, code, stdin }) {
  const data = await request(`/api/rooms/${roomId}/run`, {
    method: "POST",
    body: { fileName, code, stdin },
    token: loadSession()?.token,
  });
  return data.run;
}

export async function listRuns(roomId) {
  const data = await request(`/api/rooms/${roomId}/runs`, { token: loadSession()?.token });
  return data.runs;
}