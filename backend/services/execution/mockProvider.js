// Used when EXECUTION_PROVIDER=mock. It does NOT run code.
export async function run({ language, code, stdin }) {
  await new Promise((r) => setTimeout(r, 500));
  return {
    status: "success",
    stdout:
      `[MOCK MODE] ${language.name} code was not executed.\n` +
      `Received ${code.length} characters of code and ${stdin.length} characters of input.\n`,
    stderr: "",
    compileOutput: "",
    timeMs: 0,
    memoryKb: 0,
    provider: "mock",
  };
}