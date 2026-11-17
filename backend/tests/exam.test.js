import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";

let t, teacher, alice, bob, room;

before(async () => {
  t = await startTestServer();
  teacher = await t.makeUser("Teacher", "teacher");
  alice = await t.makeUser("Alice");
  bob = await t.makeUser("Bob");

  const created = await t.call("POST", "/api/rooms", {
    token: teacher.token,
    body: { name: "Exam", mode: "exam", language: "Python" },
  });
  room = created.data.room;
  for (const s of [alice, bob]) {
    await t.call("POST", "/api/rooms/join", { token: s.token, body: { code: room.code } });
  }
});
after(() => t.close());

const p = (suffix = "") => `/api/rooms/${room.id}${suffix}`;

// A new student joins, starts the exam and submits the given code
async function submitAs(user, code) {
  await t.call("POST", "/api/rooms/join", { token: user.token, body: { code: room.code } });
  const start = await t.call("POST", p("/exam/start"), { token: user.token });
  assert.equal(start.status, 200);
  const sub = await t.call("POST", p("/exam/session/submit"), { token: user.token, body: { code } });
  assert.equal(sub.status, 200);
}

test("exam setup is owner only, and it is validated", async () => {
  const byStudent = await t.call("PUT", p("/exam"), {
    token: alice.token,
    body: { title: "Hack", durationMinutes: 99, problem: "free marks" },
  });
  assert.equal(byStudent.status, 403);

  const badDuration = await t.call("PUT", p("/exam"), {
    token: teacher.token,
    body: { title: "Mid-term", durationMinutes: 0, problem: "Print the second largest number." },
  });
  assert.equal(badDuration.status, 400);

  const shortProblem = await t.call("PUT", p("/exam"), {
    token: teacher.token,
    body: { title: "Mid-term", durationMinutes: 1, problem: "hi" },
  });
  assert.equal(shortProblem.status, 400);

  const ok = await t.call("PUT", p("/exam"), {
    token: teacher.token,
    body: { title: "Mid-term", durationMinutes: 1, problem: "Print the second largest number." },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.exam.open, false);
});

test("students cannot see the problem, start, or run code before the exam is open", async () => {
  const view = await t.call("GET", p("/exam"), { token: alice.token });
  assert.equal(view.status, 200);
  assert.equal(view.data.exam.title, "Mid-term");
  assert.equal(view.data.problem, null);
  assert.equal(view.data.session, null);

  const start = await t.call("POST", p("/exam/start"), { token: alice.token });
  assert.equal(start.status, 403);

  const run = await t.call("POST", p("/run"), {
    token: alice.token,
    body: { fileName: "main.py", code: "print(1)" },
  });
  assert.equal(run.status, 403);
});

test("the server sets the end time, and starting again cannot restart the clock", async () => {
  const open = await t.call("PATCH", p("/exam/open"), { token: teacher.token, body: { open: true } });
  assert.equal(open.status, 200);

  const first = await t.call("POST", p("/exam/start"), { token: alice.token });
  assert.equal(first.status, 200);
  const { startedAt, endsAt } = first.data.session;
  assert.equal(new Date(endsAt) - new Date(startedAt), 60 * 1000);
  assert.equal(first.data.problem, "Print the second largest number.");
  assert.ok(Math.abs(Date.now() - first.data.serverNow) < 5000, "serverNow is the server's clock");

  const second = await t.call("POST", p("/exam/start"), { token: alice.token });
  assert.equal(second.data.session.endsAt, endsAt);

  const byTeacher = await t.call("POST", p("/exam/start"), { token: teacher.token });
  assert.equal(byTeacher.status, 403);
});

test("autosave and event counters work, and exam students are locked out of everything else", async () => {
  const save = await t.call("PUT", p("/exam/session"), { token: alice.token, body: { code: "print(2)" } });
  assert.equal(save.status, 200);

  await t.call("POST", p("/exam/session/event"), { token: alice.token, body: { type: "tab" } });
  const paste = await t.call("POST", p("/exam/session/event"), { token: alice.token, body: { type: "paste" } });
  assert.equal(paste.data.pastes, 1);
  const tab2 = await t.call("POST", p("/exam/session/event"), { token: alice.token, body: { type: "tab" } });
  assert.equal(tab2.data.tabSwitches, 2);

  const badEvent = await t.call("POST", p("/exam/session/event"), { token: alice.token, body: { type: "hack" } });
  assert.equal(badEvent.status, 400);

  const files = await t.call("GET", p("/files"), { token: alice.token });
  assert.deepEqual(files.data.files, []);
  const createFile = await t.call("POST", p("/files"), { token: alice.token, body: { name: "x.py" } });
  assert.equal(createFile.status, 403);

  const messages = await t.call("GET", p("/messages"), { token: alice.token });
  assert.deepEqual(messages.data.messages, []);

  for (const path of ["/exam/sessions", "/exam/similarity"]) {
    const { status } = await t.call("GET", p(path), { token: alice.token });
    assert.equal(status, 403, path);
  }
});

test("when time runs out the server submits the last autosave, even with no browser open", async () => {
  // Pretend the exam ended a minute ago
  await t.models.ExamSession.updateOne({ student: alice.id }, { endsAt: new Date(Date.now() - 60 * 1000) });

  const view = await t.call("GET", p("/exam"), { token: alice.token });
  assert.ok(view.data.session.submittedAt);
  assert.equal(view.data.session.submitReason, "timeout");
  assert.equal(view.data.session.code, "print(2)");

  const lateSave = await t.call("PUT", p("/exam/session"), { token: alice.token, body: { code: "print(3)" } });
  assert.equal(lateSave.status, 403);
  const lateEvent = await t.call("POST", p("/exam/session/event"), { token: alice.token, body: { type: "tab" } });
  assert.equal(lateEvent.status, 403);

  // Submitting again is harmless and does not change the saved work
  const again = await t.call("POST", p("/exam/session/submit"), { token: alice.token, body: { code: "print(4)" } });
  assert.equal(again.status, 200);
  assert.equal(again.data.session.code, "print(2)");

  const list = await t.call("GET", p("/exam/sessions"), { token: teacher.token });
  const row = list.data.students.find((s) => s.id === alice.id);
  assert.equal(row.status, "submitted");
  assert.equal(row.submitReason, "timeout");
  assert.equal(row.tabSwitches, 2);
  assert.equal(row.pastes, 1);
});

test("grading rules are enforced by the server", async () => {
  const notStarted = await t.call("PATCH", p(`/exam/sessions/${bob.id}/grade`), {
    token: teacher.token,
    body: { grade: 70, feedback: "" },
  });
  assert.equal(notStarted.status, 404);

  await t.call("POST", p("/exam/start"), { token: bob.token });
  const notSubmitted = await t.call("PATCH", p(`/exam/sessions/${bob.id}/grade`), {
    token: teacher.token,
    body: { grade: 70, feedback: "" },
  });
  assert.equal(notSubmitted.status, 400);

  const tooHigh = await t.call("PATCH", p(`/exam/sessions/${alice.id}/grade`), {
    token: teacher.token,
    body: { grade: 150, feedback: "" },
  });
  assert.equal(tooHigh.status, 400);

  const byStudent = await t.call("PATCH", p(`/exam/sessions/${alice.id}/grade`), {
    token: alice.token,
    body: { grade: 100, feedback: "" },
  });
  assert.equal(byStudent.status, 403);

  const ok = await t.call("PATCH", p(`/exam/sessions/${alice.id}/grade`), {
    token: teacher.token,
    body: { grade: 85, feedback: "Good work" },
  });
  assert.equal(ok.status, 200);

  const view = await t.call("GET", p("/exam"), { token: alice.token });
  assert.equal(view.data.session.grade, 85);
  assert.equal(view.data.session.feedback, "Good work");
});

const SAME = [
  "def second_largest(numbers):",
  "    unique = sorted(set(numbers))",
  "    if len(unique) < 2:",
  "        return -1",
  "    return unique[-2]",
  "",
  "values = list(map(int, input().split()))",
  "print(second_largest(values))",
  "",
].join("\n");

const DIFFERENT = [
  "import sys",
  "",
  "tokens = sys.stdin.read().split()",
  "high = low = None",
  "for token in tokens:",
  "    n = int(token)",
  "    if high is None or n > high:",
  "        low, high = high, n",
  "    elif n != high and (low is None or n > low):",
  "        low = n",
  "sys.stdout.write(str(-1 if low is None else low))",
].join("\n");

test("the similarity estimate flags identical solutions and ignores tiny or different ones", async () => {
  const dee = await t.makeUser("Dee");
  const eli = await t.makeUser("Eli");
  const fay = await t.makeUser("Fay");
  await submitAs(dee, SAME);
  await submitAs(eli, SAME);
  await submitAs(fay, DIFFERENT);

  const { status, data } = await t.call("GET", p("/exam/similarity"), { token: teacher.token });
  assert.equal(status, 200);
  const of = (user) => data.results.find((r) => r.studentId === user.id);

  assert.equal(of(dee).percent, 100);
  assert.equal(of(dee).withName, "Eli");
  assert.equal(of(eli).percent, 100);
  assert.ok(of(fay).percent < 50, `Fay should not look similar, got ${of(fay).percent}`);
  assert.equal(of(alice).percent, null, "one-line solutions are too short to compare");
});

test("closing the exam stops new students from starting", async () => {
  const gus = await t.makeUser("Gus");
  await t.call("POST", "/api/rooms/join", { token: gus.token, body: { code: room.code } });
  await t.call("PATCH", p("/exam/open"), { token: teacher.token, body: { open: false } });

  const start = await t.call("POST", p("/exam/start"), { token: gus.token });
  assert.equal(start.status, 403);
});