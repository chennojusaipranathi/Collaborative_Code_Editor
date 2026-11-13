import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;
const base = (roomId) => `/api/rooms/${roomId}`;

// Returns { task, submission }
export function getTask(roomId) {
  return request(`${base(roomId)}/task`, { token: token() });
}

export async function saveTask(roomId, { title, description, deadline }) {
  const data = await request(`${base(roomId)}/task`, {
    method: "PUT",
    body: { title, description, deadline },
    token: token(),
  });
  return data.task;
}

export function deleteTask(roomId) {
  return request(`${base(roomId)}/task`, { method: "DELETE", token: token() });
}

export function submitTask(roomId) {
  return request(`${base(roomId)}/task/submit`, { method: "POST", token: token() });
}

export async function listSubmissions(roomId) {
  const data = await request(`${base(roomId)}/submissions`, { token: token() });
  return data.submissions;
}