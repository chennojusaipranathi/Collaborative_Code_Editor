import Execution from "../models/Execution.js";
import User from "../models/User.js";
import { executeCode } from "../services/execution/index.js";
import { languageFor } from "../services/execution/languages.js";

function publicRun(e) {
  return {
    id: e._id,
    userName: e.userName,
    fileName: e.fileName,
    language: e.language,
    status: e.status,
    stdout: e.stdout,
    stderr: e.stderr,
    compileOutput: e.compileOutput,
    timeMs: e.timeMs,
    memoryKb: e.memoryKb,
    provider: e.provider,
    createdAt: e.createdAt,
  };
}

export async function runCode(req, res) {
  const { fileName, code, stdin } = req.body;

  const language = languageFor(fileName);
  if (!language) {
    return res.status(400).json({ message: "This file type cannot be run. Use .js, .ts, .py, .java or .cpp" });
  }

  let result;
  try {
    result = await executeCode({ language, code, stdin });
  } catch (err) {
    return res.status(502).json({ message: err.message });
  }

  const user = await User.findById(req.user.id);
  const run = await Execution.create({
    room: req.params.roomId,
    user: req.user.id,
    userName: user?.name ?? "Unknown",
    fileName,
    language: language.name,
    ...result,
  });

  res.json({ run: publicRun(run) });
}

export async function listRuns(req, res) {
  const runs = await Execution.find({ room: req.params.roomId }).sort({ createdAt: -1 }).limit(20);
  res.json({ runs: runs.map(publicRun) });
}