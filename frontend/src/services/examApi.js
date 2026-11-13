import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;
const base = (roomId) => `/api/rooms/${roomId}/exam`;

export const getExam = (roomId) => request(base(roomId), { token: token() });

export const startExam = (roomId) => request(`${base(roomId)}/start`, { method: "POST", token: token() });

export const saveCode = (roomId, code) =>
  request(`${base(roomId)}/session`, { method: "PUT", body: { code }, token: token() });

// type is "tab" or "paste". Returns the server's counters.
export const sendEvent = (roomId, type) =>
  request(`${base(roomId)}/session/event`, { method: "POST", body: { type }, token: token() });

export const submitExam = (roomId, code) =>
  request(`${base(roomId)}/session/submit`, { method: "POST", body: { code }, token: token() });