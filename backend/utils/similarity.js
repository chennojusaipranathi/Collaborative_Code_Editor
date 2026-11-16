// A basic text-overlap estimate. It is NOT a plagiarism engine.
const TOKEN = /[A-Za-z_]\w*|\d+|[^\s\w]/g;
const SHINGLE = 4; // compare runs of 4 tokens in a row

// The set of 4-token runs in some code, leaving out runs that appear in `ignore` (the starter code)
export function shingleSet(code, ignore = new Set()) {
  const tokens = code.match(TOKEN) ?? [];
  const set = new Set();
  for (let i = 0; i + SHINGLE <= tokens.length; i++) {
    const run = tokens.slice(i, i + SHINGLE).join(" ");
    if (!ignore.has(run)) set.add(run);
  }
  return set;
}

// 0 to 1: how much of the two sets is shared
export function overlap(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const run of a) if (b.has(run)) shared++;
  return shared / (a.size + b.size - shared);
}