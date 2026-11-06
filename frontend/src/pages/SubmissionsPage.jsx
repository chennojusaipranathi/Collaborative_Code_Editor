import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderX, Inbox } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import TelemetryNotice from "../components/common/TelemetryNotice";
import useAuth from "../hooks/useAuth";
import useSubmissions from "../hooks/useSubmissions";
import { timeAgo } from "../utils/timeAgo";

export default function SubmissionsPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  return <SubmissionsView key={roomId} roomId={roomId} user={user} />;
}

function SubmissionsView({ roomId, user }) {
  const { data, loading, error, grade } = useSubmissions(roomId, user);

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((n) => <div key={n} className="h-14 rounded-xl bg-line" />)}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <EmptyState icon={FolderX} title={error} text="Open a Lab Exam room to see submissions.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </AppShell>
    );
  }

  return <SubmissionsContent roomId={roomId} user={user} data={data} onGrade={grade} />;
}

function SubmissionsContent({ roomId, user, data, onGrade }) {
  const isTeacher = user.role === "teacher";
  const [openId, setOpenId] = useState(null);
  const opened = data.submissions.find((s) => s.id === openId) ?? null;

  return (
    <AppShell>
      <Link to={`/room/${roomId}`} className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to editor
      </Link>
      <h1 className="text-2xl font-bold text-ink">
        {isTeacher ? "Submissions and results" : "My result"}
      </h1>
      <p className="mb-6 text-sm text-muted">{data.room.name}</p>

      {isTeacher && (
        <div className="mb-6">
          <TelemetryNotice>
            Tab switches and paste counts are disclosed to students and are context only, not
            proof of cheating. Similarity percentages are <strong>mock demo values</strong>{" "}
            until a real analysis engine is added.
          </TelemetryNotice>
        </div>
      )}

      {data.submissions.length === 0 ? (
        <EmptyState icon={Inbox} title="No submissions yet" text="Submissions appear here once students submit." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Submitted</th>
                {isTeacher && <th className="px-4 py-3">Tabs / Pastes</th>}
                {isTeacher && <th className="px-4 py-3">Similarity (demo)</th>}
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.submissions.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{s.studentName}</td>
                  <td className="px-4 py-3 text-muted">
                    {timeAgo(s.submittedAt)}
                    {s.reason === "timeout" && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                        auto
                      </span>
                    )}
                  </td>
                  {isTeacher && <td className="px-4 py-3 text-muted">{s.tabSwitches} / {s.pastes}</td>}
                  {isTeacher && (
                    <td className="px-4 py-3 text-muted">
                      {s.similarity === null ? "Not analysed" : `${s.similarity}%`}
                    </td>
                  )}
                  <td className="px-4 py-3 text-ink">
                    {s.grade === null ? <span className="text-muted">Not graded</span> : `${s.grade}/100`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setOpenId(s.id)} className="text-indigo-400 hover:underline">
                      {isTeacher ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {opened && (
        <SubmissionModal
          submission={opened}
          isTeacher={isTeacher}
          onGrade={onGrade}
          onClose={() => setOpenId(null)}
        />
      )}
    </AppShell>
  );
}

function SubmissionModal({ submission, isTeacher, onGrade, onClose }) {
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onGrade(submission.id, grade, feedback);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={`${submission.studentName}'s submission`} onClose={onClose}>
      <pre className="mb-4 max-h-52 overflow-auto rounded-lg border border-line bg-app p-3 font-mono text-xs text-ink">
        {submission.code || "(empty)"}
      </pre>

      {isTeacher ? (
        <form onSubmit={handleSave}>
          <Input label="Grade (0 to 100)" id="grade" type="number" value={grade}
            onChange={(e) => setGrade(e.target.value)} />
          <div className="mb-4">
            <label htmlFor="feedback" className="mb-1 block text-sm font-medium text-ink">Feedback</label>
            <textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
              className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400" />
          </div>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save grade"}
          </Button>
        </form>
      ) : (
        <div className="text-sm">
          <p className="text-ink">
            Grade: {submission.grade === null ? "Not graded yet" : `${submission.grade}/100`}
          </p>
          {submission.feedback && <p className="mt-2 text-muted">Feedback: {submission.feedback}</p>}
        </div>
      )}
    </Modal>
  );
}