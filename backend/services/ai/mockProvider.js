// Used when AI_PROVIDER=mock. NO AI is involved: it only counts things in the code.
export async function ask({ action, fileName, language, code, question }) {
  await new Promise((r) => setTimeout(r, 400));

  const lines = code.split("\n");
  const nonEmpty = lines.filter((l) => l.trim()).length;
  const comments = lines.filter((l) => /^\s*(\/\/|#|\*|\/\*)/.test(l)).length;
  const functions = [...code.matchAll(/(?:function\s+(\w+)|def\s+(\w+)|(?:public|private|static)[\w\s<>\[\]]*\s(\w+)\s*\()/g)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .filter(Boolean);

  const facts =
    `${fileName} (${language}): ${lines.length} lines, ${nonEmpty} with code, ${comments} comment lines.\n` +
    (functions.length ? `Functions or methods found: ${[...new Set(functions)].join(", ")}.\n` : "No functions found.\n");

  const heading = {
    explain: "Explain code",
    bugs: "Find bugs",
    improve: "Suggest improvements",
    ask: `Question: ${question}`,
  }[action];

  return {
    answer:
      `[MOCK MODE: no AI was used] ${heading}\n\n${facts}\n` +
      "Real explanations, bug reports and suggestions appear here once the server is switched to a real AI provider.",
    provider: "mock",
  };
}