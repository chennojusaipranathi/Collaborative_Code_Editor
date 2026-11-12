import { request } from "./api";
import { loadSession } from "./authService";

const token = () => loadSession()?.token;

export async function createInvite(roomId, { role, expiresInHours }) {
  const data = await request(`/api/rooms/${roomId}/invites`, {
    method: "POST",
    body: { role, expiresInHours },
    token: token(),
  });
  return data.invite;
}

export async function listInvites(roomId) {
  const data = await request(`/api/rooms/${roomId}/invites`, { token: token() });
  return data.invites;
}

export function revokeInvite(roomId, inviteId) {
  return request(`/api/rooms/${roomId}/invites/${inviteId}`, { method: "DELETE", token: token() });
}

export function previewInvite(inviteToken) {
  return request(`/api/invites/${inviteToken}`, { token: token() });
}

export function acceptInvite(inviteToken) {
  return request(`/api/invites/${inviteToken}/accept`, { method: "POST", token: token() });
}