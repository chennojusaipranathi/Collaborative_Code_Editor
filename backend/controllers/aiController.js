import { askAI } from "../services/ai/index.js";
import { getRoomRules } from "../utils/fileAccess.js";
import { languageFor } from "../services/execution/languages.js";

export async function askAssistant(req, res) {
  // During an exam the assistant is off for students (the owner may still use it)
  const rules = await getRoomRules(req.params.roomId);
  if (rules?.mode === "exam" && req.membership.role !== "owner") {
    return res.status(403).json({ message: "The assistant is disabled during exams" });
  }

  const { action, fileName, code, question } = req.body;
  const language = languageFor(fileName)?.name ?? "the same language as the file name suggests";

  try {
    const result = await askAI({ action, fileName, language, code, question });
    res.json(result);
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
}