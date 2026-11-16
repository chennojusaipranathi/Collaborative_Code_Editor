import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;
const base = (roomId) => `/api/rooms/${roomId}/exam`;

// ---- student ----

export const getExam = (roomId) => request(base(roomId), { token: token() });

export const startExam = (roomId) => request(`${base(roomId)}/start`, { method: "POST", token: token() });

export const saveCode = (roomId, code) =>
  request(`${base(roomId)}/session`, { method: "PUT", body: { code }, token: token() });

// type is "tab" or "paste". Returns the server's counters.
export const sendEvent = (roomId, type) =>
  request(`${base(roomId)}/session/event`, { method: "POST", body: { type }, token: token() });

export const submitExam = (roomId, code) =>
  request(`${base(roomId)}/session/submit`, { method: "POST", body: { code }, token: token() });

// ---- teacher ----

// Create or change the exam. Returns { title, durationMinutes, open, problem }
export async function saveExam(roomId, { title, durationMinutes, problem }) {
  const data = await request(base(roomId), {
    method: "PUT",
    body: { title, durationMinutes, problem },
    token: token(),
  });
  return data.exam;
}

export const setExamOpen = (roomId, open) =>
  request(`${base(roomId)}/open`, { method: "PATCH", body: { open }, token: token() });

export const deleteExam = (roomId) => request(base(roomId), { method: "DELETE", token: token() });

// Returns { exam, serverNow, students: [...] }
export const listSessions = (roomId) => request(`${base(roomId)}/sessions`, { token: token() });

// One student's session with their code. Returns { session }
export const getSession = (roomId, studentId) =>
  request(`${base(roomId)}/sessions/${studentId}`, { token: token() });

export const gradeSession = (roomId, studentId, { grade, feedback }) =>
  request(`${base(roomId)}/sessions/${studentId}/grade`, {
    method: "PATCH",
    body: { grade, feedback },
    token: token(),
  });

// Returns the list of { studentId, percent, withName }
export async function getSimilarity(roomId) {
  const data = await request(`${base(roomId)}/similarity`, { token: token() });
  return data.results;
}