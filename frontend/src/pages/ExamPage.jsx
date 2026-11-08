import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Timer, Play, Send, FolderX, ShieldAlert, CheckCircle2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useExam from "../hooks/useExam";
import useCountdown from "../hooks/useCountdown";
import { submitExam } from "../services/examService";
import { formatTime } from "../utils/formatTime";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import ThemeToggle from "../components/common/ThemeToggle";
import TelemetryNotice from "../components/common/TelemetryNotice";

export default function ExamPage() {
  const { roomId } = useParams();
  const { user } = useAuth();

  // Teachers don't take exams: send them to the submissions page instead
  if (user.role === "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4">
        <EmptyState icon={ShieldAlert} title="Students only" text="Teachers review work on the submissions page.">
          <Button to={`/room/${roomId}/submissions`}>View submissions</Button>
        </EmptyState>
      </div>
    );
  }

  return <ExamView key={roomId} roomId={roomId} user={user} />;
}

function ExamView({ roomId, user }) {
  const { data, loading, error } = useExam(roomId, user);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app text-muted">
        Preparing your exam...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-app px-4">
        <EmptyState icon={FolderX} title={error} text="Open a Lab Exam room to take an exam.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </div>
    );
  }

  return <ExamWorkspace roomId={roomId} user={user} data={data} />;
}

function ExamWorkspace({ roomId, user, data }) {
  const { room, problem, endsAt, serverNow } = data;
  const remaining = useCountdown(endsAt, serverNow);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [pastes, setPastes] = useState(0);
  const [submitted, setSubmitted] = useState(data.submitted);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // A ref (not state) so two quick calls can never submit twice
  const sentRef = useRef(data.submitted);

  const timeUp = remaining <= 0;
  const locked = submitted || timeUp;

  // Count how many times the student leaves this tab (disclosed telemetry)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !sentRef.current) setTabSwitches((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const submit = async (reason) => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSubmitting(true);
    try {
      await submitExam({ roomId, user, code, tabSwitches, pastes, reason });
      setSubmitted(true);
      setMessage(
        reason === "timeout"
          ? "Time is up. Your work was submitted automatically."
          : "Your solution was submitted."
      );
    } catch (err) {
      sentRef.current = false;
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit the moment the timer reaches zero (the ref blocks repeats)
  useEffect(() => {
    if (!timeUp) return;
    // Run in a timer callback so setState is not called synchronously in the effect
    const id = setTimeout(() => submit("timeout"), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  // MOCK run: real execution (Judge0) arrives in Phase 7
  const handleRun = () => {
    setOutput((lines) => [...lines, "[mock] Code execution is added in Phase 7."]);
  };

  return (
    <div className="flex h-screen flex-col bg-app">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <h1 className="truncate text-sm font-semibold text-ink">{room.name}</h1>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${
              remaining < 60000 ? "text-red-400" : "text-ink"
            }`}
          >
            <Timer size={16} /> {formatTime(remaining)}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Problem statement */}
        <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-b border-line bg-surface p-5 lg:w-96 lg:border-b-0 lg:border-r">
          <TelemetryNotice>
            This exam records how many times you switch tabs and paste text. Your teacher sees
            these counts. They are context for review, not proof of any wrongdoing.
          </TelemetryNotice>
          <div>
            <h2 className="text-lg font-semibold text-ink">{problem.title}</h2>
            <p className="mt-2 text-sm text-muted">{problem.statement}</p>
          </div>
          <pre className="rounded-lg border border-line bg-app p-3 font-mono text-xs text-ink">
            {problem.example}
          </pre>
          <p className="text-xs text-muted">
            Tab switches: {tabSwitches} · Pastes: {pastes}
          </p>
        </aside>

        {/* Code + output */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {submitted ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
              <CheckCircle2 size={44} className="text-green-400" />
              <p className="text-lg font-semibold text-ink">Submitted</p>
              <p className="text-sm text-muted">{message || "Your solution is already submitted."}</p>
              <Button to={`/room/${roomId}/submissions`}>View my result</Button>
            </div>
          ) : (
            <>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onPaste={() => setPastes((n) => n + 1)}
                disabled={locked}
                spellCheck={false}
                wrap="off"
                placeholder={`Write your ${room.language} solution here...`}
                className="min-h-0 flex-1 resize-none bg-app p-4 font-mono text-sm leading-6 text-ink outline-none disabled:opacity-60"
              />
              <div className="h-32 shrink-0 overflow-y-auto border-t border-line bg-surface p-3 font-mono text-xs">
                {output.length === 0 ? (
                  <p className="text-muted">Run your code to see output here.</p>
                ) : (
                  output.map((line, i) => <p key={i} className="text-ink">{line}</p>)
                )}
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2">
                <p className="text-sm text-red-400">{message}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleRun} disabled={locked}>
                    <Play size={16} /> Run
                  </Button>
                  <Button onClick={() => submit("manual")} disabled={locked || submitting}>
                    <Send size={16} /> {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}