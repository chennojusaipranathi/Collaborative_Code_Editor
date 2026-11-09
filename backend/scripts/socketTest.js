import { io } from "socket.io-client";

const API = "http://localhost:5000";

// Small helper for POST requests to the REST API
async function post(path, body, token) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// Resolves with { socket } on success or { error } if the server refuses us
function connect(token) {
  return new Promise((resolve) => {
    const socket = io(API, { auth: { token }, reconnection: false });
    socket.on("connect", () => resolve({ socket }));
    socket.on("connect_error", (err) => {
      socket.close();
      resolve({ error: err.message });
    });
  });
}

// Emits room:join and waits for the server's reply
const join = (socket, roomId) =>
  new Promise((resolve) => socket.emit("room:join", roomId, resolve));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name, passed, detail = "") {
  if (!passed) failures++;
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

// ---- Setup: log in both users and make a fresh room owned by the teacher ----
const teacher = await post("/api/auth/login", { email: "teacher@college.edu", password: "123456" });
const student = await post("/api/auth/login", { email: "student@college.edu", password: "123456" });
const { room } = await post("/api/rooms", { name: "Socket Test", language: "Python" }, teacher.token);

// ---- Test 1 and 2: bad credentials ----
const noToken = await connect(undefined);
check("1. No token is refused", Boolean(noToken.error), noToken.error);

const fakeToken = await connect("not.a.real.token");
check("2. Fake token is refused", Boolean(fakeToken.error), fakeToken.error);

// ---- Test 3: logged in, but NOT a member of the room ----
const outsider = await connect(student.token);
const denied = await join(outsider.socket, room.id);
check("3. Non-member cannot join the room", denied.ok === false, denied.message);

// ---- Test 4: a real member joins, and presence updates ----
const owner = await connect(teacher.token);
const ownerJoin = await join(owner.socket, room.id);
check("4a. Owner can join", ownerJoin.ok === true && ownerJoin.role === "owner");

// The student joins the room through the REST API first, then via socket
await post("/api/rooms/join", { code: room.code }, student.token);
const lastPresence = { users: [] };
owner.socket.on("presence:update", (users) => (lastPresence.users = users));

const memberJoin = await join(outsider.socket, room.id);
await wait(300);
check("4b. Student can join after becoming a member", memberJoin.ok === true);
check("4c. Owner sees 2 users online", lastPresence.users.length === 2);

outsider.socket.disconnect();
await wait(500);
check("4d. Presence drops to 1 after the student disconnects", lastPresence.users.length === 1);

owner.socket.disconnect();
console.log(failures === 0 ? "\nAll socket security tests passed." : `\n${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);