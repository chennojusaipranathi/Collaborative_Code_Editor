// Maps a file extension to a language name
const EXTENSIONS = {
  js: "JavaScript",
  ts: "TypeScript",
  py: "Python",
  java: "Java",
  cpp: "C++",
};

export function languageFromFileName(name) {
  const ext = name.split(".").pop().toLowerCase();
  return EXTENSIONS[ext] ?? "Plain Text";
}