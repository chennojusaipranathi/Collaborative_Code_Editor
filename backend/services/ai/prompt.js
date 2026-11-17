export function buildRequest({ action, fileName, language, code, question } = {}) {
  const system =
    "You are a helpful coding assistant inside a code editor. " +
    "Be clear and concise. Use short paragraphs and code blocks where helpful.";

  const a = String(action ?? "").toLowerCase();
  const lang = language ? ` ${language}` : "";
  const file = fileName ? ` (file: ${fileName})` : "";
  const codeBlock = code ? `\n\n\`\`\`\n${code}\n\`\`\`` : "";

  let prompt;
  if (a.includes("explain")) {
    prompt = `Explain what this${lang} code does, step by step${file}.${codeBlock}`;
  } else if (a.includes("bug")) {
    prompt = `Find bugs or likely errors in this${lang} code${file}. For each one, say what is wrong and how to fix it. If there are none, say so.${codeBlock}`;
  } else if (a.includes("improve")) {
    prompt = `Suggest improvements to this${lang} code${file}: readability, performance and best practices. Show the improved version.${codeBlock}`;
  } else {
    // free-form question; include the code as context if present
    prompt = `${question ?? ""}${code ? `\n\nContext${file}:${codeBlock}` : ""}`;
  }

  return { system, prompt: prompt.trim() };
}