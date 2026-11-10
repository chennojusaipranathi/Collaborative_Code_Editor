import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;
const base = (roomId, fileId) => `/api/rooms/${roomId}/files/${fileId}/snapshots`;

// The room (name and my role) and its files, loaded together
export async function getRoomInfo(roomId) {
  const [roomData, fileData] = await Promise.all([
    request(`/api/rooms/${roomId}`, { token: token() }),
    request(`/api/rooms/${roomId}/files`, { token: token() }),
  ]);
  return { room: roomData.room, files: fileData.files };
}

// Returns { file, current, snapshots }
export function getHistory(roomId, fileId) {
  return request(base(roomId, fileId), { token: token() });
}

export async function getSnapshot(roomId, fileId, snapshotId) {
  const data = await request(`${base(roomId, fileId)}/${snapshotId}`, { token: token() });
  return data.snapshot;
}

export async function createSnapshot(roomId, fileId, label) {
  const data = await request(base(roomId, fileId), { method: "POST", body: { label }, token: token() });
  return data.snapshot;
}

export function restoreSnapshot(roomId, fileId, snapshotId) {
  return request(`${base(roomId, fileId)}/${snapshotId}/restore`, { method: "POST", token: token() });
}