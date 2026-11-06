// MOCK classroom service. Phase 9 replaces this with live data over Socket.io.
import { getRooms } from "./roomService";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

const TASK = {
  title: "Reverse a linked list",
  description: "Write a function that reverses a singly linked list in place.",
  deadline: "Today, 5:00 PM",
};

let locked = false;

let students = [
  { id: "st1", name: "Priya", status: "coding", handRaised: true, lastActive: minutesAgo(0),
    code: "def reverse(head):\n    prev = None\n    cur = head\n    while cur:\n        nxt = cur.next" },
  { id: "st2", name: "Rahul", status: "coding", handRaised: false, lastActive: minutesAgo(1),
    code: "def reverse(head):\n    if not head:\n        return None\n    # TODO" },
  { id: "st3", name: "Anita", status: "idle", handRaised: false, lastActive: minutesAgo(14),
    code: "# reverse linked list\n" },
  { id: "st4", name: "Karthik", status: "submitted", handRaised: false, lastActive: minutesAgo(22),
    code: "def reverse(head):\n    prev = None\n    while head:\n        head.next, prev, head = prev, head, head.next\n    return prev" },
  { id: "st5", name: "Sneha", status: "coding", handRaised: true, lastActive: minutesAgo(2),
    code: "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None" },
  { id: "st6", name: "Vikram", status: "offline", lastActive: minutesAgo(180), handRaised: false,
    code: "" },
];

export async function getClassroom(roomId) {
  await delay(600);
  const rooms = await getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) throw new Error("Room not found");
  if (room.mode !== "classroom") throw new Error("This room is not a classroom");
  return { room, task: TASK, students: [...students], locked };
}

export async function setLocked(value) {
  await delay(300);
  locked = value;
  return locked;
}

export async function dismissHand(studentId) {
  await delay(200);
  students = students.map((s) => (s.id === studentId ? { ...s, handRaised: false } : s));
}