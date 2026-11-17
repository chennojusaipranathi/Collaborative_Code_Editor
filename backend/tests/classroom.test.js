import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";

let t, teacher, ann, ben, room;

before(async () => {
  t = await startTestServer();
  teacher = await t.makeUser("Teacher", "teacher");
  ann = await t.makeUser("Ann");
  ben = await t.makeUser("Ben");

  const created = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Class", mode: "classroom", language: "Python" },
  });
  room = created.data.room;
});
after(() => t.close());

const p = (suffix = "") => `/api/rooms/${room.id}${suffix}`;
const filesOf = async (user) => (await t.call("GET", p("/files"), { token: user.token })).data.files;
const ownFile = async (user) => (await filesOf(user)).find((f) => f.owner === user.id);

test("each student gets a personal file when they join", async () => {
  for (const s of [ann, ben]) {
    const join = await t.call("POST", "/api/rooms/join", { token: s.token, body: { code: room.code } });
    assert.equal(join.status, 201);
  }

  const mine = await filesOf(ann);
  assert.ok(mine.some((f) => f.owner === ann.id), "Ann has her own file");
  assert.ok(mine.some((f) => f.owner === null), "Ann also sees the teacher's shared file");
  assert.ok(!mine.some((f) => f.owner === ben.id), "Ann cannot see Ben's file");

  const all = await filesOf(teacher);
  assert.equal(all.filter((f) => f.owner).length, 2, "the teacher sees both student files");
});

test("students cannot create files or open the teacher's monitor", async () => {
  const create = await t.call("POST", p("/files"), { token: ann.token, body: { name: "extra.py" } });
  assert.equal(create.status, 403);

  const monitor = await t.call("GET", p("/classroom"), { token: ann.token });
  assert.equal(monitor.status, 403);

  const teacherMonitor = await t.call("GET", p("/classroom"), { token: teacher.token });
  assert.equal(teacherMonitor.status, 200);
});

test("a student edits only their own file, never the shared file or another student's", async () => {
  const annFile = await ownFile(ann);
  const shared = (await filesOf(teacher)).find((f) => !f.owner);

  const own = await t.call("PATCH", p(`/files/${annFile.id}`), {
    token: ann.token,
    body: { content: "print('ann')" },
  });
  assert.equal(own.status, 200);

  const onShared = await t.call("PATCH", p(`/files/${shared.id}`), {
    token: ann.token,
    body: { content: "print('overwritten')" },
  });
  assert.equal(onShared.status, 403);

  const byBen = await t.call("PATCH", p(`/files/${annFile.id}`), {
    token: ben.token,
    body: { content: "print('stolen')" },
  });
  assert.equal(byBen.status, 403);

  const deleteByBen = await t.call("DELETE", p(`/files/${annFile.id}`), { token: ben.token });
  assert.equal(deleteByBen.status, 403);
});

test("another student cannot read a student's version history, but the teacher can", async () => {
  const annFile = await ownFile(ann);
  const byBen = await t.call("GET", p(`/files/${annFile.id}/snapshots`), { token: ben.token });
  assert.equal(byBen.status, 404);

  const byTeacher = await t.call("GET", p(`/files/${annFile.id}/snapshots`), { token: teacher.token });
  assert.equal(byTeacher.status, 200);
});

test("locking editing stops students at once, and only the teacher can lock", async () => {
  const annFile = await ownFile(ann);

  const byStudent = await t.call("PATCH", p("/lock"), { token: ann.token, body: { locked: true } });
  assert.equal(byStudent.status, 403);

  const lock = await t.call("PATCH", p("/lock"), { token: teacher.token, body: { locked: true } });
  assert.equal(lock.status, 200);
  assert.equal(lock.data.locked, true);

  const blocked = await t.call("PATCH", p(`/files/${annFile.id}`), {
    token: ann.token,
    body: { content: "print('typed while locked')" },
  });
  assert.equal(blocked.status, 403);

  // The teacher is never locked out, so they can still help a student
  const help = await t.call("PATCH", p(`/files/${annFile.id}`), {
    token: teacher.token,
    body: { content: "print('ann')" },
  });
  assert.equal(help.status, 200);

  const unlock = await t.call("PATCH", p("/lock"), { token: teacher.token, body: { locked: false } });
  assert.equal(unlock.status, 200);

  const again = await t.call("PATCH", p(`/files/${annFile.id}`), {
    token: ann.token,
    body: { content: "print('ann again')" },
  });
  assert.equal(again.status, 200);
});

test("only classroom rooms can be locked", async () => {
  const free = await t.call("POST", "/api/rooms", { token: teacher.token, body: { name: "Free room" } });
  const { status } = await t.call("PATCH", `/api/rooms/${free.data.room.id}/lock`, {
    token: teacher.token,
    body: { locked: true },
  });
  assert.equal(status, 400);
});

test("only the teacher can assign a task, and it is validated", async () => {
  const byStudent = await t.call("PUT", p("/task"), {
    token: ann.token,
    body: { title: "Hack", description: "", deadline: null },
  });
  assert.equal(byStudent.status, 403);

  const bad = await t.call("PUT", p("/task"), {
    token: teacher.token,
    body: { title: "x", description: "", deadline: null },
  });
  assert.equal(bad.status, 400);

  const ok = await t.call("PUT", p("/task"), {
    token: teacher.token,
    body: { title: "Reverse a list", description: "Write a function.", deadline: null },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.task.closed, false);
});

test("a student submits their own file, and resubmitting replaces the earlier version", async () => {
  const annFile = await ownFile(ann);

  const view = await t.call("GET", p("/task"), { token: ann.token });
  assert.equal(view.data.task.title, "Reverse a list");

  await t.call("PATCH", p(`/files/${annFile.id}`), { token: ann.token, body: { content: "print('final answer')" } });
  const first = await t.call("POST", p("/task/submit"), { token: ann.token });
  assert.equal(first.status, 200);

  const list = await t.call("GET", p("/submissions"), { token: teacher.token });
  assert.equal(list.data.submissions.length, 1);
  assert.equal(list.data.submissions[0].studentId, ann.id);
  assert.equal(list.data.submissions[0].content, "print('final answer')");

  await t.call("PATCH", p(`/files/${annFile.id}`), { token: ann.token, body: { content: "print('better answer')" } });
  await t.call("POST", p("/task/submit"), { token: ann.token });

  const after = await t.call("GET", p("/submissions"), { token: teacher.token });
  assert.equal(after.data.submissions.length, 1, "still one row per student");
  assert.equal(after.data.submissions[0].content, "print('better answer')");

  const byStudent = await t.call("GET", p("/submissions"), { token: ben.token });
  assert.equal(byStudent.status, 403);
});

test("the monitor shows who has submitted", async () => {
  const { status, data } = await t.call("GET", p("/classroom"), { token: teacher.token });
  assert.equal(status, 200);
  const byName = Object.fromEntries(data.students.map((s) => [s.name, s]));
  assert.equal(byName.Ann.status, "submitted");
  assert.equal(byName.Ben.status, "offline"); // joined, but not online and not submitted
});

test("the deadline is enforced by the server", async () => {
  const past = new Date(Date.now() - 3600 * 1000).toISOString();
  const closed = await t.call("PUT", p("/task"), {
    token: teacher.token,
    body: { title: "Reverse a list", description: "", deadline: past },
  });
  assert.equal(closed.data.task.closed, true);

  const late = await t.call("POST", p("/task/submit"), { token: ben.token });
  assert.equal(late.status, 403);
  assert.equal(late.data.message, "The deadline has passed");

  const future = new Date(Date.now() + 3600 * 1000).toISOString();
  await t.call("PUT", p("/task"), {
    token: teacher.token,
    body: { title: "Reverse a list", description: "", deadline: future },
  });
  const onTime = await t.call("POST", p("/task/submit"), { token: ben.token });
  assert.equal(onTime.status, 200);
});

test("removing the task deletes its submissions", async () => {
  const del = await t.call("DELETE", p("/task"), { token: teacher.token });
  assert.equal(del.status, 200);

  const list = await t.call("GET", p("/submissions"), { token: teacher.token });
  assert.equal(list.data.submissions.length, 0);

  const view = await t.call("GET", p("/task"), { token: ann.token });
  assert.equal(view.data.task, null);
});