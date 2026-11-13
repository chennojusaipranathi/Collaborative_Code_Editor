import { useState } from "react";
import { CheckCircle2, ClipboardList, Send } from "lucide-react";

export default function TaskBar({ task, submission, canSubmit, onSubmit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!task) {
    return (
      <p className="shrink-0 border-b border-line bg-surface px-4 py-1.5 text-xs text-muted">
        No task has been assigned yet.
      </p>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError("");
    const problem = await onSubmit();
    if (problem) setError(problem);
    setBusy(false);
  };

  return (
    <div className="shrink-0 border-b border-line bg-surface px-4 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <ClipboardList size={16} className="shrink-0 text-indigo-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{task.title}</p>
          <p className="text-xs text-muted">
            {task.deadline ? `Due ${new Date(task.deadline).toLocaleString()}` : "No deadline"}
            {task.closed && <span className="ml-2 text-red-400">Closed</span>}
          </p>
        </div>

        {submission && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 size={14} /> Submitted {new Date(submission.submittedAt).toLocaleTimeString()}
          </span>
        )}

        {canSubmit && (
          <button
            onClick={submit}
            disabled={busy || task.closed}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            <Send size={14} /> {busy ? "Submitting..." : submission ? "Resubmit" : "Submit"}
          </button>
        )}
      </div>

      {task.description && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-muted">Show instructions</summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-ink">{task.description}</p>
        </details>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}