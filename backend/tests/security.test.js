import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import jwt from "jsonwebtoken";
import { startTestServer } from "./helpers.js";
import { env } from "../config/env.js";

let t, user;

before(async () => {
  t = await startTestServer();
  user = await t.makeUser("Sam");
});
after(() => t.close());

// A plain GET that lets us set any headers (including Origin) and read the reply headers
function rawGet(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http
      .get(t.baseUrl + path, { headers }, (res) => {
        res.resume();
        resolve(res.headers);
      })
      .on("error", reject);
  });
}

test("security headers are set and the framework is not advertised", async () => {
  const headers = await rawGet("/api/health");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.ok(headers["strict-transport-security"]);
  assert.equal(headers["x-powered-by"], undefined);
});

test("only the listed frontend origins get CORS headers", async () => {
  const allowed = env.allowedOrigins[0];
  const ok = await rawGet("/api/health", { Origin: allowed });
  assert.equal(ok["access-control-allow-origin"], allowed);

  const evil = await rawGet("/api/health", { Origin: "https://evil.example" });
  assert.equal(evil["access-control-allow-origin"], undefined);
});

test("login rejects NoSQL-style payloads instead of querying with them", async () => {
  const attacks = [
    { email: { $gt: "" }, password: "secret123" },
    { email: user.email, password: { $ne: null } },
    { email: ["a@test.dev"], password: "secret123" },
  ];
  for (const body of attacks) {
    const { status } = await t.call("POST", "/api/auth/login", { body });
    assert.equal(status, 400, JSON.stringify(body));
  }
});

test("a request body over the limit gets 413, not a crash", async () => {
  const body = JSON.stringify({ email: "a@test.dev", password: "x".repeat(2 * 1024 * 1024) });
  const { status, data } = await t.call("POST", "/api/auth/login", { body });
  assert.equal(status, 413);
  assert.equal(data.message, "Request is too large");
});

test("errors never include stack traces or internals", async () => {
  const { data } = await t.call("GET", "/api/does-not-exist");
  assert.deepEqual(Object.keys(data), ["message"]);
});

test("a token with no signature ('alg: none') is rejected", async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "none", typ: "JWT" })}.${b64({ id: user.id, role: "teacher" })}.`;
  const { status } = await t.call("GET", "/api/auth/me", { token: unsigned });
  assert.equal(status, 401);
});

test("an expired token is rejected by the API and by the socket", async () => {
  const expired = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: -10 });

  const api = await t.call("GET", "/api/auth/me", { token: expired });
  assert.equal(api.status, 401);

  const socket = await t.connectSocket(expired);
  assert.ok(socket.error, "the socket connection should be refused");
});

test("a valid token still works (the checks above are not just rejecting everything)", async () => {
  const { status, data } = await t.call("GET", "/api/auth/me", { token: user.token });
  assert.equal(status, 200);
  assert.equal(data.user.email, user.email);
});