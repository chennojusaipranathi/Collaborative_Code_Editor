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

// Monaco's language ids, by file extension
const MONACO_IDS = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  py: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  json: "json",
  html: "html",
  css: "css",
  md: "markdown",
  txt: "plaintext",
};

export function monacoLanguage(name) {
  const ext = name.split(".").pop().toLowerCase();
  return MONACO_IDS[ext] ?? "plaintext";
}