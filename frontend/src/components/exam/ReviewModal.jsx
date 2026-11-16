import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { getSession, gradeSession } from "../../services/examApi";

export default function ReviewModal({ roomId, student, onClose, onGraded }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [error, setError] = useState("");
  const [grade, setGrade] = useState(student.grade ?? "");
  const [feedback, setFeedback] = useState(student.feedback ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getSession(roomId, student.id)
      .then((d) => active && setSession(d.session))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [roomId, student.id]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await gradeSession(roomId, student.id, { grade: Number(grade), feedback });
      onGraded(student.id, saved.grade, saved.feedback);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const submitted = Boolean(session?.submittedAt);

  return (
    <Modal title={`${student.name}'s solution`} onClose={onClose}>
      {session === undefined && !error && <p className="text-sm text-muted">Loading...</p>}

      {session && (
        <>
          <p className="mb-2 text-xs text-muted">
            {submitted
              ? `Submitted ${new Date(session.submittedAt).toLocaleString()}${
                  session.submitReason === "timeout" ? " (time ran out)" : ""
                }`
              : "Still working. This is the latest autosave."}{" "}
            · Tab switches: {session.tabSwitches} · Pastes: {session.pastes}
          </p>
          <pre className="mb-4 max-h-72 overflow-auto rounded-lg border border-line bg-app p-3 font-mono text-xs text-ink">
            {session.code || "(empty)"}
          </pre>

          {submitted ? (
            <form onSubmit={save}>
              <Input label="Grade (0 to 100)" id="grade" type="number" min={0} max={100}
                value={grade} onChange={(e) => setGrade(e.target.value)} />
              <div className="mb-4">
                <label htmlFor="feedback" className="mb-1 block text-sm font-medium text-ink">Feedback</label>
                <textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400" />
              </div>
              {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={saving || grade === ""}>
                {saving ? "Saving..." : "Save grade"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-amber-400">You can grade this once the student has submitted.</p>
          )}
        </>
      )}

      {error && !session && <p className="text-sm text-red-400">{error}</p>}
    </Modal>
  );
}