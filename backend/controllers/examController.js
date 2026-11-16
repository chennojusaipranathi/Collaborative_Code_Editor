import mongoose from "mongoose";
import Exam from "../models/Exam.js";
import ExamSession from "../models/ExamSession.js";
import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import User from "../models/User.js";
import { STARTER_FILES } from "../utils/starterFiles.js";
import { shingleSet, overlap } from "../utils/similarity.js";


const GRACE_MS = 5000; // tolerance for network delay on the last save or submit
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // typed in the last 2 minutes = coding
const PREVIEW_CHARS = 400;

const starterFor = (language) => STARTER_FILES[language] ?? STARTER_FILES.JavaScript;

function publicSession(s) {
  return {
    startedAt: s.startedAt,
    endsAt: s.endsAt,
    submittedAt: s.submittedAt,
    submitReason: s.submitReason,
    code: s.code,
    tabSwitches: s.tabSwitches,
    pastes: s.pastes,
    grade: s.grade,
    feedback: s.feedback,
  };
}

// Sends the 400 itself and returns null when the room is not an exam
async function loadExamRoom(roomId, res) {
  const room = await Room.findById(roomId).select("name mode language");
  if (room?.mode !== "exam") {
    res.status(400).json({ message: "This room is not a lab exam" });
    return null;
  }
  return room;
}

// If time ran out (plus grace) and the student never submitted, the SERVER submits for them
async function expireIfNeeded(session) {
  if (session && !session.submittedAt && Date.now() > session.endsAt.getTime() + GRACE_MS) {
    session.submittedAt = session.endsAt;
    session.submitReason = "timeout";
    await session.save();
  }
  return session;
}

// The session is writable only while it is running (small grace for the final autosave)
function runningFilter(examId, studentId) {
  return {
    exam: examId,
    student: studentId,
    submittedAt: null,
    endsAt: { $gte: new Date(Date.now() - GRACE_MS) },
  };
}

// Used by the Run endpoint: students may run code only during their own exam
export async function hasActiveSession(roomId, userId) {
  const exam = await Exam.findOne({ room: roomId }).select("_id");
  if (!exam) return false;
  const s = await ExamSession.findOne(runningFilter(exam._id, userId)).select("_id");
  return Boolean(s);
}

// ---------- everyone in the room ----------

export async function getExam(req, res) {
  const { roomId } = req.params;
  const room = await loadExamRoom(roomId, res);
  if (!room) return;

  const isOwner = req.membership.role === "owner";
  const base = {
    myRole: req.membership.role,
    room: { name: room.name, language: room.language },
    fileName: starterFor(room.language).name,
    serverNow: Date.now(), // the browser measures its clock against this
    exam: null,
    problem: null,
    session: null,
  };

  const exam = await Exam.findOne({ room: roomId });
  if (!exam) return res.json(base);

  let session = null;
  if (!isOwner) {
    session = await expireIfNeeded(await ExamSession.findOne({ exam: exam._id, student: req.user.id }));
  }

  res.json({
    ...base,
    exam: { title: exam.title, durationMinutes: exam.durationMinutes, open: exam.open },
    // Students see the problem only after they start
    problem: isOwner || session ? exam.problem : null,
    session: session ? publicSession(session) : null,
  });
}

// ---------- teacher (owner) ----------

export async function saveExam(req, res) {
  const { roomId } = req.params;
  if (!(await loadExamRoom(roomId, res))) return;

  const { title, durationMinutes, problem } = req.body;
  // Changing the duration only affects students who start AFTER the change
  const exam = await Exam.findOneAndUpdate(
    { room: roomId },
    { $set: { title, durationMinutes, problem }, $setOnInsert: { createdBy: req.user.id } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  res.json({ exam: { title: exam.title, durationMinutes: exam.durationMinutes, open: exam.open, problem: exam.problem } });
}

export async function setExamOpen(req, res) {
  const exam = await Exam.findOneAndUpdate(
    { room: req.params.roomId },
    { $set: { open: req.body.open } },
    { returnDocument: "after" }
  );
  if (!exam) return res.status(404).json({ message: "Set up the exam first" });
  res.json({ open: exam.open });
}

export async function deleteExam(req, res) {
  const exam = await Exam.findOne({ room: req.params.roomId });
  if (!exam) return res.status(404).json({ message: "No exam to remove" });
  await ExamSession.deleteMany({ exam: exam._id });
  await Exam.deleteOne({ _id: exam._id });
  res.json({ message: "Exam removed" });
}

export async function listSessions(req, res) {
  const { roomId } = req.params;
  if (!(await loadExamRoom(roomId, res))) return;

  const exam = await Exam.findOne({ room: roomId });
  if (!exam) return res.json({ exam: null, serverNow: Date.now(), students: [] });

  const members = await RoomParticipant.find({ room: roomId, role: "editor" })
    .populate("user", "name")
    .sort({ createdAt: 1 });

  const sessions = await ExamSession.find({ exam: exam._id });
  for (const s of sessions) await expireIfNeeded(s);
  const byStudent = new Map(sessions.map((s) => [String(s.student), s]));

  const now = Date.now();
  const students = members
    .filter((m) => m.user)
    .map((m) => {
      const id = String(m.user._id);
      const s = byStudent.get(id);

      let status = "not_started";
      if (s) {
        const lastActive = (s.lastActiveAt ?? s.startedAt).getTime();
        status = s.submittedAt ? "submitted" : now - lastActive < ACTIVE_WINDOW_MS ? "coding" : "idle";
      }

      return {
        id,
        name: m.user.name,
        status,
        startedAt: s?.startedAt ?? null,
        endsAt: s?.endsAt ?? null,
        submittedAt: s?.submittedAt ?? null,
        submitReason: s?.submitReason ?? "",
        tabSwitches: s?.tabSwitches ?? 0,
        pastes: s?.pastes ?? 0,
        grade: s?.grade ?? null,
        feedback: s?.feedback ?? "",
        preview: s ? s.code.slice(0, PREVIEW_CHARS) : "",
      };
    });

  res.json({
    exam: { title: exam.title, durationMinutes: exam.durationMinutes, open: exam.open, problem: exam.problem },
    serverNow: now,
    students,
  });
}

export async function getSession(req, res) {
  const { roomId, studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) return res.status(404).json({ message: "Student not found" });

  const exam = await Exam.findOne({ room: roomId }).select("_id");
  if (!exam) return res.status(404).json({ message: "No exam yet" });

  const session = await expireIfNeeded(await ExamSession.findOne({ exam: exam._id, student: studentId }));
  if (!session) return res.status(404).json({ message: "This student has not started" });

  res.json({ session: { ...publicSession(session), studentName: session.studentName } });
}

export async function gradeSession(req, res) {
  const { roomId, studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) return res.status(404).json({ message: "Student not found" });

  const exam = await Exam.findOne({ room: roomId }).select("_id");
  if (!exam) return res.status(404).json({ message: "No exam yet" });

  const session = await expireIfNeeded(await ExamSession.findOne({ exam: exam._id, student: studentId }));
  if (!session) return res.status(404).json({ message: "This student has not started" });
  if (!session.submittedAt) return res.status(400).json({ message: "The student has not submitted yet" });

  session.grade = req.body.grade;
  session.feedback = req.body.feedback;
  await session.save();
  res.json({ grade: session.grade, feedback: session.feedback });
}

// ---------- student ----------

export async function startExam(req, res) {
  const { roomId } = req.params;
  if (req.membership.role === "owner") {
    return res.status(403).json({ message: "The teacher cannot take the exam" });
  }
  const room = await loadExamRoom(roomId, res);
  if (!room) return;

  const exam = await Exam.findOne({ room: roomId });
  if (!exam) return res.status(404).json({ message: "No exam has been set up yet" });

  let session = await ExamSession.findOne({ exam: exam._id, student: req.user.id });

  if (!session) {
    if (!exam.open) return res.status(403).json({ message: "The exam is not open yet" });

    const user = await User.findById(req.user.id).select("name");
    const now = Date.now();
    try {
      session = await ExamSession.create({
        exam: exam._id,
        room: roomId,
        student: req.user.id,
        studentName: user?.name ?? "Unknown",
        startedAt: new Date(now),
        endsAt: new Date(now + exam.durationMinutes * 60 * 1000), // the server's clock decides
        code: starterFor(room.language).content,
        lastActiveAt: new Date(now),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      // Two clicks at once: the other request created it first, so use that one
      session = await ExamSession.findOne({ exam: exam._id, student: req.user.id });
    }
  }

  await expireIfNeeded(session);
  res.json({ serverNow: Date.now(), problem: exam.problem, session: publicSession(session) });
}

export async function saveSession(req, res) {
  const exam = await Exam.findOne({ room: req.params.roomId }).select("_id");
  if (!exam) return res.status(404).json({ message: "No exam yet" });

  const now = new Date();
  const updated = await ExamSession.findOneAndUpdate(
    runningFilter(exam._id, req.user.id),
    { $set: { code: req.body.code, lastActiveAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) {
    return res.status(403).json({ message: "Your exam has ended or was already submitted" });
  }
  res.json({ savedAt: now });
}

// Counters are incremented by the SERVER, so a browser can never lower them
export async function recordEvent(req, res) {
  const exam = await Exam.findOne({ room: req.params.roomId }).select("_id");
  if (!exam) return res.status(404).json({ message: "No exam yet" });

  const field = req.body.type === "tab" ? "tabSwitches" : "pastes";
  const updated = await ExamSession.findOneAndUpdate(
    runningFilter(exam._id, req.user.id),
    { $inc: { [field]: 1 } },
    { returnDocument: "after" }
  );
  if (!updated) return res.status(403).json({ message: "Your exam has ended or was already submitted" });
  res.json({ tabSwitches: updated.tabSwitches, pastes: updated.pastes });
}

export async function submitSession(req, res) {
  const exam = await Exam.findOne({ room: req.params.roomId }).select("_id");
  if (!exam) return res.status(404).json({ message: "No exam yet" });

  const session = await expireIfNeeded(await ExamSession.findOne({ exam: exam._id, student: req.user.id }));
  if (!session) return res.status(404).json({ message: "You have not started the exam" });

  // Submitting twice is harmless: the second call just returns the first result
  if (session.submittedAt) return res.json({ session: publicSession(session) });

  const now = Date.now();
  const end = session.endsAt.getTime();
  const update = {
    submittedAt: new Date(Math.min(now, end)), // never later than the deadline
    submitReason: now >= end ? "timeout" : "manual",
  };
  if (typeof req.body.code === "string") update.code = req.body.code;

  const done = await ExamSession.findOneAndUpdate(
    { _id: session._id, submittedAt: null },
    { $set: update },
    { returnDocument: "after" }
  );
  res.json({ session: publicSession(done ?? (await ExamSession.findById(session._id))) });
}

// ---------- teacher: basic similarity estimate ----------

const MIN_RUNS = 8; // too little code to compare fairly
const MAX_COMPARED = 100;

export async function similarity(req, res) {
  const { roomId } = req.params;
  const room = await loadExamRoom(roomId, res);
  if (!room) return;

  const exam = await Exam.findOne({ room: roomId }).select("_id");
  if (!exam) return res.json({ results: [] });

  const all = await ExamSession.find({ exam: exam._id });
  for (const s of all) await expireIfNeeded(s);

  // Only finished work is compared, so nobody is compared mid-exam
  const done = all.filter((s) => s.submittedAt).slice(0, MAX_COMPARED);

  // The starter code is shared by everyone, so it must not count as similarity
  const starter = shingleSet(starterFor(room.language).content);
  const sets = done.map((s) => shingleSet(s.code, starter));

  const results = done.map((s, i) => {
    if (sets[i].size < MIN_RUNS) {
      return { studentId: String(s.student), percent: null, withName: null };
    }
    let best = 0;
    let bestName = null;
    for (let j = 0; j < done.length; j++) {
      if (i === j || sets[j].size < MIN_RUNS) continue;
      const score = overlap(sets[i], sets[j]);
      if (score > best) {
        best = score;
        bestName = done[j].studentName;
      }
    }
    return {
      studentId: String(s.student),
      percent: Math.round(best * 100),
      withName: best > 0 ? bestName : null,
    };
  });

  res.json({ results });
}