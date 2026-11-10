// File extension -> language name and Judge0 language id
const BY_EXTENSION = {
  js: { name: "JavaScript", judge0Id: 63 },
  ts: { name: "TypeScript", judge0Id: 74 },
  py: { name: "Python", judge0Id: 71 },
  java: { name: "Java", judge0Id: 62 },
  cpp: { name: "C++", judge0Id: 54 },
};

export function languageFor(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  return BY_EXTENSION[ext] ?? null;
}