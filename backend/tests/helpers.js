// Test helpers. This file points the app at a TEST database BEFORE the app loads.
import "dotenv/config";
import http from "http";
import { io as ioClient } from "socket.io-client";

process.env.NODE_ENV = "test"; // turns off rate limiting (see middleware/rateLimit.js)

const realUri = process.env.MONGODB_URI;
const testUri = process.env.MONGODB_URI_TEST;

if (!testUri) {
  console.error("Missing MONGODB_URI_TEST in backend/.env. Tests never use your real database.");
  process.exit(1);
}
if (testUri === realUri) {
  console.error("MONGODB_URI_TEST must be different from MONGODB_URI.");
  process.exit(1);
}
process.env.MONGODB_URI = testUri;

// Loaded AFTER the environment is set, so the app sees the test database
const { default: mongoose } = await import("mongoose");
const { default: app } = await import("../app.js");
const { initSockets } = await import("../sockets/index.js");
const { flushAll } = await import("../sockets/docStore.js");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startTestServer() {
  await mongoose.connect(testUri);

  // Last safety net: refuse to run (and to delete anything) unless the name says "test"
  if (!/test/i.test(mongoose.connection.name)) {
    await mongoose.disconnect();
    throw new Error(`Refusing to run tests on database "${mongoose.connection.name}"`);
  }

  // Make sure unique indexes exist, then start every file with empty collections
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));

  const server = http.createServer(app);
  const sockets = initSockets(server);
  await new Promise((resolve) => server.listen(0, resolve)); // port 0 = any free port
  const baseUrl = `http://localhost:${server.address().port}`;

  // Sends a request and returns { status, data }. `body` may be an object or a raw string.
  async function call(method, path, { token, body } = {}) {
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // Registers a user with a unique email and returns { id, name, email, role, token }
  let counter = 0;
  async function makeUser(name, role = "student") {
    counter += 1;
    const email = `${name.toLowerCase()}${counter}@test.dev`;
    const { status, data } = await call("POST", "/api/auth/register", {
      body: { name, email, password: "secret123", role },
    });
    if (status !== 201) throw new Error(`Could not create test user: ${data.message}`);
    return { ...data.user, email, token: data.token };
  }

  // Opens a socket the way a browser would. Returns { socket } or { error }.
  const opened = [];
  function connectSocket(token) {
    return new Promise((resolve) => {
      const socket = ioClient(baseUrl, { auth: { token }, reconnection: false, transports: ["websocket"] });
      opened.push(socket);
      socket.on("connect", () => resolve({ socket }));
      socket.on("connect_error", (err) => {
        socket.close();
        resolve({ error: err.message });
      });
    });
  }

  // Sends a socket event and waits for the server's acknowledgement
  function emit(socket, event, payload) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`No reply to "${event}"`)), 8000);
      socket.emit(event, payload, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
    });
  }

  // Polls until check() is truthy, or fails after the timeout
  async function waitFor(check, { timeout = 8000, every = 50 } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await check()) return;
      await wait(every);
    }
    throw new Error("Timed out waiting for a condition");
  }

  async function close() {
    for (const s of opened) s.close();
    await wait(300); // let disconnect handlers finish their saves
    await flushAll();
    sockets.disconnectSockets(true);
    server.closeAllConnections?.();
    await new Promise((resolve) => sockets.close(resolve));
    await mongoose.disconnect();
  }

  return { call, makeUser, connectSocket, emit, waitFor, close,baseUrl, models: mongoose.models };
}