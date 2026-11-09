const COLORS = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#ef4444", "#8b5cf6",
  "#14b8a6", "#f97316", "#84cc16", "#3b82f6", "#d946ef",
];

// The same user id always gets the same color
export function colorFor(id) {
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}