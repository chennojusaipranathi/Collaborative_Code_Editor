// MOCK exam service. It plays the role of the SERVER.
// The key idea: the deadline is calculated here, never by the browser.
import { getRooms } from "./roomService";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Short on purpose so you can test auto-submit quickly. Change to 30 for a real exam.
const DURATION_MINUTES = 2;

const PROBLEM = {
  title: "Second largest number",
  statement:
    "Read n integers from input and print the second largest distinct value. " +
    "If there is no second largest value, print -1.",
  example: "Input: 4 9 7 9\nOutput: 7",
};

const exams = {}; // roomId -> { startedAt }

let submissions = [
  { id: "sub1", studentId: "st1", studentName: "Priya", code: "nums = list(set(map(int, input().split())))\nnums.sort()\nprint(nums[-2] if len(nums) > 1 else -1)",
    submittedAt: new Date(Date.now() - 20 * 60000).toISOString(), reason: "manual", tabSwitches: 1, pastes: 0, similarity: 12, grade: 90, feedback: "Clean and correct." },
  { id: "sub2", studentId: "st2", studentName: "Rahul", code: "nums = list(map(int, input().split()))\nnums.sort()\nprint(nums[-2])",
    submittedAt: new Date(Date.now() - 12 * 60000).toISOString(), reason: "manual", tabSwitches: 6, pastes: 3, similarity: 74, grade: null, feedback: "" },
  { id: "sub3", studentId: "st3", studentName: "Anita", code: "# ran out of time\nprint(-1)",
    submittedAt: new Date(Date.now() - 5 * 60000).toISOString(), reason: "timeout", tabSwitches: 0, pastes: 0, similarity: 5, grade: null, feedback: "" },
];

async function findExamRoom(roomId) {
  const rooms = await getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) throw new Error("Room not found");
  if (room.mode !== "exam") throw new Error("This room is not a lab exam");
  return room;
}

// Starts the student's timer the first time they open the exam
export async function getExam(roomId, user) {
  await delay(500);
  const room = await findExamRoom(roomId);

  if (!exams[roomId]) exams[roomId] = { startedAt: Date.now() };
  const endsAt = exams[roomId].startedAt + DURATION_MINUTES * 60000;

  return {
    room,
    problem: PROBLEM,
    endsAt,
    serverNow: Date.now(), // the browser compares its clock with this
    submitted: submissions.some((s) => s.studentId === user.id),
  };
}

export async function submitExam({ roomId, user, code, tabSwitches, pastes, reason }) {
  await delay(400);
  const endsAt = exams[roomId].startedAt + DURATION_MINUTES * 60000;

  if (submissions.some((s) => s.studentId === user.id)) {
    throw new Error("You have already submitted");
  }
  // Server-side deadline check: a manual submit after the deadline is rejected
  if (reason === "manual" && Date.now() > endsAt + 5000) {
    throw new Error("Time is over");
  }

  submissions = [
    {
      id: crypto.randomUUID(),
      studentId: user.id,
      studentName: user.name,
      code,
      submittedAt: new Date().toISOString(),
      reason,
      tabSwitches,
      pastes,
      similarity: null, // no analysis engine yet
      grade: null,
      feedback: "",
    },
    ...submissions,
  ];
}

// The "server" decides what each role may see
export async function getSubmissions(roomId, user) {
  await delay(500);
  const room = await findExamRoom(roomId);
  const rows =
    user.role === "teacher"
      ? [...submissions]
      : submissions.filter((s) => s.studentId === user.id);
  return { room, submissions: rows };
}

export async function gradeSubmission(id, grade, feedback, user) {
  await delay(300);
  if (user.role !== "teacher") throw new Error("Only teachers can grade");
  const value = Number(grade);
  if (Number.isNaN(value) || value < 0 || value > 100) {
    throw new Error("Grade must be between 0 and 100");
  }
  submissions = submissions.map((s) =>
    s.id === id ? { ...s, grade: value, feedback: feedback.trim() } : s
  );
  return submissions.find((s) => s.id === id);
}