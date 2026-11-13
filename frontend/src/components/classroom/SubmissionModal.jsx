import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import { listSubmissions } from "../../services/taskService";

export default function SubmissionModal({ roomId, student, onClose }) {
  const [submission, setSubmission] = useState(undefined); // undefined = loading
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listSubmissions(roomId)
      .then((list) => active && setSubmission(list.find((s) => s.studentId === student.id) ?? null))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [roomId, student.id]);

  return (
    <Modal title={`${student.name}'s submission`} onClose={onClose}>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : submission === undefined ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : submission === null ? (
        <p className="text-sm text-muted">No submission found.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">
            {submission.fileName} · submitted {new Date(submission.submittedAt).toLocaleString()}
          </p>
          <pre className="max-h-80 overflow-auto rounded-lg border border-line bg-app p-3 font-mono text-xs text-ink">
            {submission.content || "(empty)"}
          </pre>
        </>
      )}
    </Modal>
  );
}