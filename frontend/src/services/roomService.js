// MOCK room service. In Phase 3 these functions call the real backend.
// Keep the function names and return shapes the same, and the UI won't change.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

// In-memory list: resets when you refresh the page (the real DB comes later)
let rooms = [
  { id: "r1", name: "DSA Practice", code: "DSA123", mode: "free", language: "Java", participants: 3, myRole: "owner", lastEdited: minutesAgo(5) },
  { id: "r2", name: "CSE-A Lab Session", code: "LAB456", mode: "classroom", language: "Python", participants: 28, myRole: "editor", lastEdited: minutesAgo(90) },
  { id: "r3", name: "Mid-term Lab Exam", code: "EXM789", mode: "exam", language: "C++", participants: 45, myRole: "viewer", lastEdited: minutesAgo(1500) },
  { id: "r4", name: "Hackathon Team", code: "HCK321", mode: "free", language: "JavaScript", participants: 4, myRole: "editor", lastEdited: minutesAgo(40) },
];

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getRooms() {
  await delay(700);
  return [...rooms];
}

export async function createRoom({ name, mode, language }) {
  await delay(500);
  if (!name.trim()) throw new Error("Room name is required");
  const room = {
    id: crypto.randomUUID(),
    name: name.trim(),
    code: makeCode(),
    mode,
    language,
    participants: 1,
    myRole: "owner",
    lastEdited: new Date().toISOString(),
  };
  rooms = [room, ...rooms];
  return room;
}

export async function joinRoom(code) {
  await delay(500);
  const clean = code.trim().toUpperCase();
  if (clean.length !== 6) throw new Error("Room code must be 6 characters");
  if (rooms.some((r) => r.code === clean)) throw new Error("You are already in this room");
  const room = {
    id: crypto.randomUUID(),
    name: `Room ${clean}`,
    code: clean,
    mode: "free",
    language: "JavaScript",
    participants: 2,
    myRole: "editor",
    lastEdited: new Date().toISOString(),
  };
  rooms = [room, ...rooms];
  return room;
}