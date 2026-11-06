import { Clock, User } from "lucide-react";
import { timeAgo } from "../../utils/timeAgo";

export default function SnapshotList({ snapshots, selectedId, onSelect }) {
  return (
    <ul className="space-y-2">
      {snapshots.map((s) => (
        <li key={s.id}>
          <button
            onClick={() => onSelect(s.id)}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              s.id === selectedId
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-line bg-surface hover:border-indigo-400"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-ink">{s.label}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  s.type === "manual" ? "bg-indigo-500/15 text-indigo-400" : "bg-slate-500/15 text-muted"
                }`}
              >
                {s.type === "manual" ? "Manual" : "Auto"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><User size={12} />{s.author}</span>
              <span className="flex items-center gap-1"><Clock size={12} />{timeAgo(s.createdAt)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}