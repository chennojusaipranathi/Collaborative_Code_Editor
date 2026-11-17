import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";

let t, teacher, student, stranger, room, fileId;

before(async () => {
  t = await startTestServer();
  teacher = await t.makeUser("Teacher", "teacher");
  student = await t.makeUser("Student");
  stranger = await t.makeUser("Stranger");
});
after(() => t.close());

const roomPath = (suffix = "") => `/api/rooms/${room.id}${suffix}`;

test("a teacher creates a room and becomes its owner, with a starter file", async () => {
  const { status, data } = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Test room", mode: "free", language: "Python" },
  });
  assert.equal(status, 201);
  assert.equal(data.room.myRole, "owner");
  assert.equal(data.room.code.length, 6);
  room = data.room;

  const files = await t.call("GET", roomPath("/files"), { token: teacher.token });
  assert.equal(files.data.files.length, 1);
  assert.equal(files.data.files[0].name, "main.py");
  fileId = files.data.files[0].id;
});

test("room creation is validated", async () => {
  const short = await t.call("POST", "/api/rooms", { token: teacher.token, body: { name: "x" } });
  assert.equal(short.status, 400);
  const badMode = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Test room", mode: "party" },
  });
  assert.equal(badMode.status, 400);
});

test("students cannot create classroom or exam rooms (the server enforces it)", async () => {
  for (const mode of ["classroom", "exam"]) {
    const { status } = await t.call("POST", "/api/rooms", {
      token: student.token,
      body: { name: "Sneaky room", mode },
    });
    assert.equal(status, 403, mode);
  }
  const free = await t.call("POST", "/api/rooms", {
    token: student.token,
    body: { name: "My own room", mode: "free" },
  });
  assert.equal(free.status, 201);
});

test("everything needs a login", async () => {
  const { status } = await t.call("GET", "/api/rooms");
  assert.equal(status, 401);
});

test("a stranger gets the same 404 for every room route", async () => {
  for (const suffix of ["", "/files", "/participants", "/messages"]) {
    const { status, data } = await t.call("GET", roomPath(suffix), { token: stranger.token });
    assert.equal(status, 404, suffix);
    assert.equal(data.message, "Room not found");
  }
  // Same answer for a room that does not exist, so ids cannot be probed
  const ghost = await t.call("GET", "/api/rooms/000000000000000000000000", { token: stranger.token });
  assert.equal(ghost.status, 404);
  const malformed = await t.call("GET", "/api/rooms/abc", { token: stranger.token });
  assert.equal(malformed.status, 404);
});

test("a stranger's room list does not include other people's rooms", async () => {
  const { data } = await t.call("GET", "/api/rooms", { token: stranger.token });
  assert.equal(data.rooms.length, 0);
});

test("joining by code makes you an editor, once", async () => {
  const join = await t.call("POST", "/api/rooms/join", { token: student.token, body: { code: room.code } });
  assert.equal(join.status, 201);
  assert.equal(join.data.room.myRole, "editor");

  const again = await t.call("POST", "/api/rooms/join", { token: student.token, body: { code: room.code } });
  assert.equal(again.status, 409);

  const wrong = await t.call("POST", "/api/rooms/join", { token: stranger.token, body: { code: "ZZZZZZ" } });
  assert.equal(wrong.status, 404);

  const short = await t.call("POST", "/api/rooms/join", { token: stranger.token, body: { code: "ABC" } });
  assert.equal(short.status, 400);
});

test("an editor can create files, but names are checked", async () => {
  const ok = await t.call("POST", roomPath("/files"), { token: student.token, body: { name: "notes.py" } });
  assert.equal(ok.status, 201);

  const duplicate = await t.call("POST", roomPath("/files"), { token: student.token, body: { name: "notes.py" } });
  assert.equal(duplicate.status, 409);

  const traversal = await t.call("POST", roomPath("/files"), { token: student.token, body: { name: "../hack" } });
  assert.equal(traversal.status, 400);
});

test("a file from another room cannot be reached through this room's URL", async () => {
  const other = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Other room", language: "Python" },
  });
  const otherFiles = await t.call("GET", `/api/rooms/${other.data.room.id}/files`, { token: teacher.token });
  const foreignFile = otherFiles.data.files[0].id;

  // The teacher owns BOTH rooms, but a file must still be looked up inside the room in the URL
  const { status } = await t.call("PATCH", roomPath(`/files/${foreignFile}`), {
    token: teacher.token,
    body: { content: "overwritten" },
  });
  assert.equal(status, 404);
});

test("only the owner can change roles, and never their own", async () => {
  const byEditor = await t.call("PATCH", roomPath(`/participants/${teacher.id}`), {
    token: student.token,
    body: { role: "viewer" },
  });
  assert.equal(byEditor.status, 403);

  const self = await t.call("PATCH", roomPath(`/participants/${teacher.id}`), {
    token: teacher.token,
    body: { role: "viewer" },
  });
  assert.equal(self.status, 400);

  const badRole = await t.call("PATCH", roomPath(`/participants/${student.id}`), {
    token: teacher.token,
    body: { role: "owner" },
  });
  assert.equal(badRole.status, 400);
});

test("a viewer can read but cannot write, run or snapshot", async () => {
  const demote = await t.call("PATCH", roomPath(`/participants/${student.id}`), {
    token: teacher.token,
    body: { role: "viewer" },
  });
  assert.equal(demote.status, 200);
  assert.equal(demote.data.participant.role, "viewer");

  const read = await t.call("GET", roomPath("/files"), { token: student.token });
  assert.equal(read.status, 200);

  const attempts = [
    ["POST", roomPath("/files"), { name: "hack.py" }],
    ["PATCH", roomPath(`/files/${fileId}`), { content: "print('hacked')" }],
    ["DELETE", roomPath(`/files/${fileId}`), undefined],
    ["POST", roomPath("/run"), { fileName: "main.py", code: "print(1)" }],
    ["POST", roomPath(`/files/${fileId}/snapshots`), { label: "sneaky" }],
  ];
  for (const [method, path, body] of attempts) {
    const { status } = await t.call(method, path, { token: student.token, body });
    assert.equal(status, 403, `${method} ${path}`);
  }
});