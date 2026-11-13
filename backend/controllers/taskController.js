import File from "../models/File.js";
import Room from "../models/Room.js";
import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { currentContent } from "../sockets/docStore.js";
import { notifyTaskChanged } from "../sockets/io.js";

export function publicTask(task) {
  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    deadline: task.deadline,
    // Decided by the server's clock, not the browser's
    closed: Boolean(task.deadline && Date.now() > task.deadline.getTime()),
  };
}

async function requireClassroom(roomId, res) {
  const room = await Room.findById(roomId).select("mode");
  if (room?.mode !== "classroom") {
    res.status(400).json({ message: "Tasks exist only in classroom rooms" });
    return null;
  }
  return room;
}

// Any member can read the task. Students also get their own submission status.
export async function getTask(req, res) {
  const { roomId } = req.params;
  const task = await Task.findOne({ room: roomId });
  if (!task) return res.json({ task: null, submission: null });

  let submission = null;
  if (req.membership.role === "editor") {
    const s = await Submission.findOne({ task: task._id, student: req.user.id }).select("submittedAt");
    submission = s ? { submittedAt: s.submittedAt } : null;
  }
  res.json({ task: publicTask(task), submission });
}

// Teacher creates or edits the task
export async function saveTask(req, res) {
  const { roomId } = req.params;
  if (!(await requireClassroom(roomId, res))) return;

  const { title, description, deadline } = req.body;
  const task = await Task.findOneAndUpdate(
    { room: roomId },
    {
      $set: { title, description, deadline: deadline ? new Date(deadline) : null },
      $setOnInsert: { createdBy: req.user.id },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  notifyTaskChanged(roomId);
  res.json({ task: publicTask(task) });
}

// Removing the task also removes its submissions (a fresh start)
export async function deleteTask(req, res) {
  const { roomId } = req.params;
  const task = await Task.findOne({ room: roomId });
  if (!task) return res.status(404).json({ message: "No task to remove" });

  await Submission.deleteMany({ task: task._id });
  await Task.deleteOne({ _id: task._id });

  notifyTaskChanged(roomId);
  res.json({ message: "Task removed" });
}

export async function submitTask(req, res) {
  const { roomId } = req.params;
  if (!(await requireClassroom(roomId, res))) return;

  const task = await Task.findOne({ room: roomId });
  if (!task) return res.status(404).json({ message: "No task has been assigned yet" });

  // Server-side deadline check: hiding the button is only convenience
  if (task.deadline && Date.now() > task.deadline.getTime()) {
    return res.status(403).json({ message: "The deadline has passed" });
  }

  const file = await File.findOne({ room: roomId, owner: req.user.id });
  if (!file) return res.status(404).json({ message: "You have no file to submit" });

  // The text comes from the server's own copy (live if the file is open), never from the browser
  const content = (await currentContent(roomId, file._id)) ?? file.content;
  const user = await User.findById(req.user.id).select("name");

  const submission = await Submission.findOneAndUpdate(
    { task: task._id, student: req.user.id },
    {
      $set: {
        room: roomId,
        studentName: user?.name ?? "Unknown",
        fileName: file.name,
        content,
        submittedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  res.json({ submission: { submittedAt: submission.submittedAt } });
}

// Teacher: every submission with its code
export async function listSubmissions(req, res) {
  const task = await Task.findOne({ room: req.params.roomId });
  if (!task) return res.json({ submissions: [] });

  const subs = await Submission.find({ task: task._id }).sort({ submittedAt: -1 });
  res.json({
    submissions: subs.map((s) => ({
      id: String(s._id),
      studentId: String(s.student),
      studentName: s.studentName,
      fileName: s.fileName,
      content: s.content,
      submittedAt: s.submittedAt,
    })),
  });
}