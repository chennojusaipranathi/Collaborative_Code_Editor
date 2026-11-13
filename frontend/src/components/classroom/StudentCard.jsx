import { Link } from "react-router-dom";
import { Hand, ExternalLink } from "lucide-react";
import { STUDENT_STATUS } from "../../utils/studentStatus";
import { timeAgo } from "../../utils/timeAgo";

export default function StudentCard({ student, roomId, onDismissHand }) {
  const status = STUDENT_STATUS[student.status];

  return (
    <div
      className={`rounded-xl border bg-surface p-4 ${
        student.handRaised ? "border-amber-400" : "border-line"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-semibold uppercase text-white">
            {student.name.charAt(0)}
          </span>
          <span className="font-medium text-ink">{student.name}</span>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Code preview: a small read-only look at what the student has typed */}
      <pre className="mb-3 h-24 overflow-hidden rounded-lg border border-line bg-app p-2 font-mono text-xs text-ink">
        {student.code || "(no code yet)"}
      </pre>

      {student.handRaised && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs text-amber-400">
          <span className="flex items-center gap-1.5"><Hand size={14} /> Needs help</span>
          <button onClick={() => onDismissHand(student.id)} className="font-medium underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{student.lastActive ? `Edited ${timeAgo(student.lastActive)}` : "No activity yet"}</span>
        <Link to={student.fileId ? `/room/${roomId}?file=${student.fileId}` : `/room/${roomId}`} className="flex items-center gap-1 text-indigo-400 hover:underline">
          Open editor <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}