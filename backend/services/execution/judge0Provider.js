import { env } from "../../config/env.js";

const MAX_OUTPUT = 10000; // characters kept per output field

const encode = (s) => Buffer.from(s ?? "", "utf8").toString("base64");
const decode = (s) => (s ? Buffer.from(s, "base64").toString("utf8").slice(0, MAX_OUTPUT) : "");

// Judge0 status ids -> our own simple statuses
function normalizeStatus(id) {
  if (id === 3) return "success";
  if (id === 5) return "timeout";
  if (id === 6) return "compile_error";
  if (id >= 7 && id <= 12) return "runtime_error";
  return "error";
}

export async function run({ language, code, stdin }) {
  let response;
  try {
    response = await fetch(`${env.judge0Url}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.judge0Token ? { "X-Auth-Token": env.judge0Token } : {}),
      },
      body: JSON.stringify({
        language_id: language.judge0Id,
        source_code: encode(code),
        stdin: encode(stdin),
        // Limits protect the shared sandbox from runaway programs
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 128000, // KB
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (err) {
    throw new Error(
      err.name === "TimeoutError" ? "The execution service took too long" : "Cannot reach the execution service"
    );
  }

  if (!response.ok) {
    throw new Error(`Execution service error (${response.status})`);
  }

  const r = await response.json();
  return {
    status: normalizeStatus(r.status?.id),
    stdout: decode(r.stdout),
    stderr: decode(r.stderr) || decode(r.message),
    compileOutput: decode(r.compile_output),
    timeMs: r.time ? Math.round(parseFloat(r.time) * 1000) : 0,
    memoryKb: r.memory ?? 0,
    provider: "judge0",
  };
}