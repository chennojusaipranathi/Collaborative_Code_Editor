import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { startTestServer } from "./helpers.js";

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.close());

const account = { name: "Asha", email: "asha@test.dev", password: "secret123", role: "student" };

test("health check reports the database as connected", async () => {
  const { status, data } = await t.call("GET", "/api/health");
  assert.equal(status, 200);
  assert.equal(data.database, "connected");
});

test("register returns the user and a token, never the password", async () => {
  const { status, data } = await t.call("POST", "/api/auth/register", { body: account });
  assert.equal(status, 201);
  assert.equal(data.user.email, account.email);
  assert.ok(data.token);
  assert.equal(data.user.passwordHash, undefined);
  assert.equal(data.user.password, undefined);
});

test("the password is stored as a bcrypt hash, not as text", async () => {
  const user = await t.models.User.findOne({ email: account.email }).select("+passwordHash");
  assert.ok(user.passwordHash.startsWith("$2"));
  assert.notEqual(user.passwordHash, account.password);
});

test("the same email cannot register twice, even in capital letters", async () => {
  const { status } = await t.call("POST", "/api/auth/register", {
    body: { ...account, email: "ASHA@test.dev" },
  });
  assert.equal(status, 409);
});

test("bad registration data is rejected with 400", async () => {
  const bad = [
    { ...account, email: "not-an-email" },
    { ...account, password: "123" },
    { ...account, name: "" },
    { ...account, email: "x@test.dev", role: "admin" }, // only student or teacher exist
  ];
  for (const body of bad) {
    const { status } = await t.call("POST", "/api/auth/register", { body });
    assert.equal(status, 400, JSON.stringify(body));
  }
});

test("login works with the right password", async () => {
  const { status, data } = await t.call("POST", "/api/auth/login", {
    body: { email: account.email, password: account.password },
  });
  assert.equal(status, 200);
  assert.ok(data.token);
});

test("a wrong password and an unknown email give the same 401 message", async () => {
  const wrong = await t.call("POST", "/api/auth/login", {
    body: { email: account.email, password: "wrong-password" },
  });
  const unknown = await t.call("POST", "/api/auth/login", {
    body: { email: "nobody@test.dev", password: "secret123" },
  });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  // Same message, so attackers cannot find out which emails are registered
  assert.equal(wrong.data.message, unknown.data.message);
});

test("/me needs a valid token", async () => {
  const none = await t.call("GET", "/api/auth/me");
  assert.equal(none.status, 401);

  const garbage = await t.call("GET", "/api/auth/me", { token: "not.a.token" });
  assert.equal(garbage.status, 401);

  const login = await t.call("POST", "/api/auth/login", {
    body: { email: account.email, password: account.password },
  });
  const me = await t.call("GET", "/api/auth/me", { token: login.data.token });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, account.email);
});

test("a token signed with the wrong secret is rejected (roles cannot be forged)", async () => {
  const user = await t.models.User.findOne({ email: account.email });
  const forged = jwt.sign({ id: String(user._id), role: "teacher" }, "attacker-secret");
  const { status } = await t.call("GET", "/api/auth/me", { token: forged });
  assert.equal(status, 401);
});

test("malformed JSON and unknown routes return clean JSON errors", async () => {
  const badJson = await t.call("POST", "/api/auth/login", { body: '{"email": ' });
  assert.equal(badJson.status, 400);
  assert.equal(badJson.data.message, "Request body is not valid JSON");

  const missing = await t.call("GET", "/api/nothing-here");
  assert.equal(missing.status, 404);
  assert.ok(missing.data.message);
});