// MOCK history service. Phase 8 replaces this with real snapshots from MongoDB.
import { getRooms } from "./roomService";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const lines = (...l) => l.join("\n");

// The "current" code of the file (changes when you restore a snapshot)
let current = lines(
  "function greet(name) {",
  "  return `Hello, ${name}!`;",
  "}",
  "",
  "function add(a, b) {",
  "  return a + b;",
  "}",
  "",
  'console.log(greet("World"));',
  "console.log(add(2, 3));"
);

let snapshots = [
  {
    id: "s3",
    label: "Auto-save",
    author: "Priya",
    type: "auto",
    createdAt: minutesAgo(12),
    content: lines(
      "function greet(name) {",
      "  return `Hello, ${name}!`;",
      "}",
      "",
      "function add(a, b) {",
      "  return a + b",
      "}",
      "",
      'console.log(greet("World"));'
    ),
  },
  {
    id: "s2",
    label: "Improved greeting",
    author: "Rahul",
    type: "manual",
    createdAt: minutesAgo(95),
    content: lines(
      "function greet(name) {",
      "  return `Hello, ${name}!`;",
      "}",
      "",
      'console.log(greet("World"));'
    ),
  },
  {
    id: "s1",
    label: "Initial version",
    author: "You",
    type: "auto",
    createdAt: minutesAgo(300),
    content: lines(
      "function greet(name) {",
      '  return "Hello " + name;',
      "}",
      "",
      'console.log(greet("World"));'
    ),
  },
];

async function findRoom(roomId) {
  const rooms = await getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) throw new Error("Room not found");
  return room;
}

function buildResponse(room) {
  return { room, fileName: "main.js", current, snapshots: [...snapshots] };
}

export async function getHistory(roomId) {
  await delay(500);
  const room = await findRoom(roomId);
  return buildResponse(room);
}

export async function createSnapshot(label, author) {
  await delay(300);
  const snapshot = {
    id: crypto.randomUUID(),
    label,
    author,
    type: "manual",
    createdAt: new Date().toISOString(),
    content: current,
  };
  snapshots = [snapshot, ...snapshots];
  return snapshot;
}

export async function restoreSnapshot(roomId, snapshotId) {
  await delay(400);
  const target = snapshots.find((s) => s.id === snapshotId);
  if (!target) throw new Error("Snapshot not found");

  // Safety net: save the current code as a backup BEFORE overwriting it
  const backup = {
    id: crypto.randomUUID(),
    label: `Backup before restoring "${target.label}"`,
    author: "System",
    type: "auto",
    createdAt: new Date().toISOString(),
    content: current,
  };
  snapshots = [backup, ...snapshots];
  current = target.content;

  const room = await findRoom(roomId);
  return buildResponse(room);
}