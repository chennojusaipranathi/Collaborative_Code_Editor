import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as Y from "yjs";
import { startTestServer } from "./helpers.js";

let t, teacher, ann, viewer, stranger, room, file, otherRoomFile;

before(async () => {
  t = await startTestServer();
  teacher = await t.makeUser("Teacher", "teacher");
  ann = await t.makeUser("Ann");
  viewer = await t.makeUser("Vera");
  stranger = await t.makeUser("Stranger");

  const created = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Live", language: "Python" },
  });
  room = created.data.room;
  file = (await t.call("GET", `/api/rooms/${room.id}/files`, { token: teacher.token })).data.files[0];

  for (const u of [ann, viewer]) {
    await t.call("POST", "/api/rooms/join", { token: u.token, body: { code: room.code } });
  }
  await t.call("PATCH", `/api/rooms/${room.id}/participants/${viewer.id}`, {
    token: teacher.token,
    body: { role: "viewer" },
  });

  // A file that belongs to a DIFFERENT room
  const other = await t.call("POST", "/api/rooms", { token: teacher.token, body: { name: "Other", language: "Python" } });
  otherRoomFile = (await t.call("GET", `/api/rooms/${other.data.room.id}/files`, { token: teacher.token })).data.files[0];
});
after(() => t.close());

// Connects and joins a room, like the editor page does
async function enter(user, roomId = room.id) {
  const { socket, error } = await t.connectSocket(user.token);
  assert.ok(socket, error);
  const res = await t.emit(socket, "room:join", roomId);
  assert.equal(res.ok, true);
  return socket;
}

// Opens a file as a shared Yjs document that stays in sync through the socket
async function openDoc(socket, fileId = file.id) {
  const doc = new Y.Doc();
  const res = await t.emit(socket, "yjs:sync", { roomId: room.id, fileId });
  assert.equal(res.ok, true, res.message);
  Y.applyUpdate(doc, new Uint8Array(res.state));

  socket.on("yjs:update", (msg) => {
    if (msg.fileId === fileId) Y.applyUpdate(doc, new Uint8Array(msg.update), "server");
  });
  doc.on("update", (update, origin) => {
    if (origin !== "server") socket.emit("yjs:update", { roomId: room.id, fileId, update });
  });
  return doc;
}

// A Yjs update that inserts some text, made by a document the server has never seen
function fakeUpdate(text) {
  const doc = new Y.Doc();
  let update;
  doc.on("update", (u) => (update = u));
  doc.getText("content").insert(0, text);
  return update;
}

test("connections without a valid token are refused", async () => {
  const none = await t.connectSocket(undefined);
  assert.ok(none.error);
  const fake = await t.connectSocket("not.a.token");
  assert.ok(fake.error);
});

test("a stranger can log in to the socket but cannot join the room or read its document", async () => {
  const { socket } = await t.connectSocket(stranger.token);

  const join = await t.emit(socket, "room:join", room.id);
  assert.equal(join.ok, false);
  assert.equal(join.message, "Room not found");

  const read = await t.emit(socket, "yjs:sync", { roomId: room.id, fileId: file.id });
  assert.equal(read.ok, false);
});

test("presence shows who is online and clears when someone disconnects", async () => {
  const a = await enter(teacher);
  let latest = [];
  a.on("presence:update", (users) => (latest = users));

  const b = await enter(ann);
  await t.waitFor(() => latest.length === 2);

  b.close();
  await t.waitFor(() => latest.length === 1);
});

test("two people typing at the same moment end up with identical text, and it is saved", async () => {
  const a = await enter(teacher);
  const b = await enter(ann);
  const docA = await openDoc(a);
  const docB = await openDoc(b);
  const textA = docA.getText("content");
  const textB = docB.getText("content");

  // Both type before either has seen the other's edit
  textA.insert(0, "# from teacher\n");
  textB.insert(textB.length, "# from ann\n");

  await t.waitFor(
    () =>
      textA.toString() === textB.toString() &&
      textA.toString().includes("# from teacher") &&
      textA.toString().includes("# from ann")
  );
  const merged = textA.toString();

  // When the last person leaves, the server saves the merged text to MongoDB
  a.close();
  b.close();
  await t.waitFor(async () => (await t.models.File.findById(file.id)).content === merged, { timeout: 10000 });
});

test("a viewer can read the live document but cannot change it", async () => {
  const v = await enter(viewer);

  const read = await t.emit(v, "yjs:sync", { roomId: room.id, fileId: file.id });
  assert.equal(read.ok, true);

  const write = await t.emit(v, "yjs:update", { roomId: room.id, fileId: file.id, update: fakeUpdate("hacked") });
  assert.equal(write.ok, false);

  const saved = await t.models.File.findById(file.id);
  assert.ok(!saved.content.includes("hacked"));
});

test("a file from another room cannot be read or edited through this room", async () => {
  const b = await enter(ann);

  const read = await t.emit(b, "yjs:sync", { roomId: room.id, fileId: otherRoomFile.id });
  assert.equal(read.ok, false);

  const write = await t.emit(b, "yjs:update", { roomId: room.id, fileId: otherRoomFile.id, update: fakeUpdate("x") });
  assert.equal(write.ok, false);
});

test("the role is checked on every edit, so demoting an editor stops their typing at once", async () => {
  const b = await enter(ann);
  await t.emit(b, "yjs:sync", { roomId: room.id, fileId: file.id });

  const before = await t.emit(b, "yjs:update", { roomId: room.id, fileId: file.id, update: fakeUpdate("allowed ") });
  assert.equal(before.ok, true);

  const demote = await t.call("PATCH", `/api/rooms/${room.id}/participants/${ann.id}`, {
    token: teacher.token,
    body: { role: "viewer" },
  });
  assert.equal(demote.status, 200);

  // Same open connection, no reconnect: the very next edit is refused
  const after = await t.emit(b, "yjs:update", { roomId: room.id, fileId: file.id, update: fakeUpdate("blocked ") });
  assert.equal(after.ok, false);
});

test("role changes are announced to everyone who has the room open", async () => {
  const a = await enter(teacher);
  const announced = new Promise((resolve) => a.once("room:changed", resolve));

  await t.call("PATCH", `/api/rooms/${room.id}/participants/${viewer.id}`, {
    token: teacher.token,
    body: { role: "viewer" },
  });

  const msg = await announced;
  assert.equal(msg.roomId, room.id);
});

test("chat reaches everyone in the room and is saved", async () => {
  const a = await enter(teacher);
  const b = await enter(viewer); // viewers may chat too
  const received = new Promise((resolve) => a.once("chat:message", resolve));

  const ack = await t.emit(b, "chat:send", { roomId: room.id, text: "  hello team  " });
  assert.equal(ack.ok, true);

  const msg = await received;
  assert.equal(msg.message.text, "hello team", "text is trimmed");
  assert.equal(msg.message.senderName, "Vera", "the name comes from the verified login");
  assert.equal(await t.models.Message.countDocuments({ room: room.id }), 1);
});

test("bad chat messages are refused", async () => {
  const b = await enter(teacher);
  const empty = await t.emit(b, "chat:send", { roomId: room.id, text: "   " });
  assert.equal(empty.ok, false);
  const long = await t.emit(b, "chat:send", { roomId: room.id, text: "x".repeat(1001) });
  assert.equal(long.ok, false);

  // A connected stranger who never joined the room cannot post into it
  const { socket } = await t.connectSocket(stranger.token);
  const outsider = await t.emit(socket, "chat:send", { roomId: room.id, text: "hi" });
  assert.equal(outsider.ok, false);
});

test("raise hand: students raise it in a classroom, and only the teacher can dismiss it", async () => {
  const created = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Class", mode: "classroom", language: "Python" },
  });
  const cr = created.data.room;
  await t.call("POST", "/api/rooms/join", { token: ann.token, body: { code: cr.code } });

  const a = await enter(teacher, cr.id);
  const b = await enter(ann, cr.id);
  let hands = [];
  a.on("classroom:hands", (m) => (hands = m.userIds));

  const raise = await t.emit(b, "hand:raise", { roomId: cr.id, raised: true });
  assert.equal(raise.ok, true);
  await t.waitFor(() => hands.includes(ann.id));

  const byStudent = await t.emit(b, "hand:dismiss", { roomId: cr.id, userId: ann.id });
  assert.equal(byStudent.ok, false);
  assert.equal(byStudent.message, "Only the teacher can do this");

  const byTeacher = await t.emit(a, "hand:dismiss", { roomId: cr.id, userId: ann.id });
  assert.equal(byTeacher.ok, true);
  await t.waitFor(() => hands.length === 0);

  // The teacher cannot raise a hand, and neither can anyone in a non-classroom room
  const teacherHand = await t.emit(a, "hand:raise", { roomId: cr.id, raised: true });
  assert.equal(teacherHand.ok, false);
  const freeRoom = await enter(ann);
  const inFree = await t.emit(freeRoom, "hand:raise", { roomId: room.id, raised: true });
  assert.equal(inFree.ok, false);
});