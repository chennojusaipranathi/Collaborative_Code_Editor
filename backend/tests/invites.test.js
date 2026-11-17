import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";

let t, teacher, guest, other, room;

before(async () => {
  t = await startTestServer();
  teacher = await t.makeUser("Teacher", "teacher");
  guest = await t.makeUser("Guest");
  other = await t.makeUser("Other");

  const created = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Invite room", language: "Python" },
  });
  room = created.data.room;
});
after(() => t.close());

const roomPath = (suffix = "") => `/api/rooms/${room.id}${suffix}`;

// Creates an invite and returns { id, token }
async function makeInvite(role, token = teacher.token) {
  const { status, data } = await t.call("POST", roomPath("/invites"), {
    token,
    body: { role, expiresInHours: 24 },
  });
  assert.equal(status, 201);
  return { id: data.invite.id, token: data.invite.link.split("/").pop() };
}

const myRole = async (user) => (await t.call("GET", roomPath(), { token: user.token })).data.room.myRole;

test("only the owner can create invites, and the role is validated", async () => {
  // `other` joins as a normal member first, so we test "member but not owner"
  await t.call("POST", "/api/rooms/join", { token: other.token, body: { code: room.code } });
  const byMember = await t.call("POST", roomPath("/invites"), { token: other.token, body: { role: "editor" } });
  assert.equal(byMember.status, 403);

  const badRole = await t.call("POST", roomPath("/invites"), { token: teacher.token, body: { role: "owner" } });
  assert.equal(badRole.status, 400);

  const badTime = await t.call("POST", roomPath("/invites"), {
    token: teacher.token,
    body: { role: "viewer", expiresInHours: 0 },
  });
  assert.equal(badTime.status, 400);
});

test("a view-only link makes a new member a viewer who cannot write", async () => {
  const invite = await makeInvite("viewer");

  const preview = await t.call("GET", `/api/invites/${invite.token}`, { token: guest.token });
  assert.equal(preview.status, 200);
  assert.equal(preview.data.room.name, "Invite room");
  assert.equal(preview.data.role, "viewer");
  assert.equal(preview.data.myRole, null);

  const accept = await t.call("POST", `/api/invites/${invite.token}/accept`, { token: guest.token });
  assert.equal(accept.status, 201);
  assert.equal(accept.data.role, "viewer");

  const write = await t.call("POST", roomPath("/files"), { token: guest.token, body: { name: "x.py" } });
  assert.equal(write.status, 403);
});

test("opening an edit link changes the role to editor, and a view link lowers it again", async () => {
  const edit = await makeInvite("editor");
  await t.call("POST", `/api/invites/${edit.token}/accept`, { token: guest.token });
  assert.equal(await myRole(guest), "editor");

  const write = await t.call("POST", roomPath("/files"), { token: guest.token, body: { name: "x.py" } });
  assert.equal(write.status, 201);

  const view = await makeInvite("viewer");
  await t.call("POST", `/api/invites/${view.token}/accept`, { token: guest.token });
  assert.equal(await myRole(guest), "viewer");
});

test("a link never changes the owner's role", async () => {
  const invite = await makeInvite("viewer");
  const accept = await t.call("POST", `/api/invites/${invite.token}/accept`, { token: teacher.token });
  assert.equal(accept.status, 200);
  assert.equal(accept.data.role, "owner");
  assert.equal(await myRole(teacher), "owner");
});

test("a revoked, expired or made-up link does not work", async () => {
  const revoked = await makeInvite("editor");
  const del = await t.call("DELETE", roomPath(`/invites/${revoked.id}`), { token: teacher.token });
  assert.equal(del.status, 200);
  const afterRevoke = await t.call("GET", `/api/invites/${revoked.token}`, { token: guest.token });
  assert.equal(afterRevoke.status, 404);

  const expired = await makeInvite("editor");
  await t.models.Invite.updateOne({ _id: expired.id }, { expiresAt: new Date(Date.now() - 1000) });
  const afterExpiry = await t.call("POST", `/api/invites/${expired.token}/accept`, { token: guest.token });
  assert.equal(afterExpiry.status, 404);

  const fake = await t.call("GET", "/api/invites/not-a-real-token", { token: guest.token });
  assert.equal(fake.status, 404);
});

test("invite routes need a login", async () => {
  const invite = await makeInvite("viewer");
  const { status } = await t.call("GET", `/api/invites/${invite.token}`);
  assert.equal(status, 401);
});