// REAL workspace service: files and people come from the backend.
import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;
const base = (roomId) => `/api/rooms/${roomId}`;

export async function getWorkspace(roomId) {
  // Three requests at the same time instead of one after another
  const [roomData, fileData, peopleData] = await Promise.all([
    request(base(roomId), { token: token() }),
    request(`${base(roomId)}/files`, { token: token() }),
    request(`${base(roomId)}/participants`, { token: token() }),
  ]);
  return { room: roomData.room, files: fileData.files, participants: peopleData.participants };
}

export async function createFile(roomId, name) {
  const data = await request(`${base(roomId)}/files`, { method: "POST", body: { name }, token: token() });
  return data.file;
}

export async function renameFile(roomId, fileId, name) {
  const data = await request(`${base(roomId)}/files/${fileId}`, { method: "PATCH", body: { name }, token: token() });
  return data.file;
}

export async function saveContent(roomId, fileId, content) {
  await request(`${base(roomId)}/files/${fileId}`, { method: "PATCH", body: { content }, token: token() });
}

export async function deleteFile(roomId, fileId) {
  await request(`${base(roomId)}/files/${fileId}`, { method: "DELETE", token: token() });
}

// Just the room (with my current role) and the member list
export async function getMembers(roomId) {
  const [roomData, peopleData] = await Promise.all([
    request(base(roomId), { token: token() }),
    request(`${base(roomId)}/participants`, { token: token() }),
  ]);
  return { room: roomData.room, participants: peopleData.participants };
}