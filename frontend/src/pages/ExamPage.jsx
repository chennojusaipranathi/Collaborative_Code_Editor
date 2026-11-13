import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { CheckCircle2, ClipboardList, FolderX, Play, RefreshCw, Send, ShieldAlert, Timer } from "lucide-react";
import useTheme from "../hooks/useTheme";
import useCountdown from "../hooks/useCountdown";
import { getExam, startExam, saveCode, sendEvent, submitExam } from "../services/examApi";
import { runCode, listRuns } from "../services/executionService";
import { monacoLanguage } from "../utils/fileLanguage";
import { formatTime } from "../utils/formatTime";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import ThemeToggle from "../components/common/ThemeToggle";
import TelemetryNotice from "../components/common/TelemetryNotice";
import BottomPanel from "../components/editor/BottomPanel";

const SAVE_DELAY_MS = 2000;

const STATUS_LABEL = {
  success: "Finished",
  compile_error: "Compilation failed",
  runtime_error: "Runtime error",
  timeout: "Time limit exceeded",
  error: "Execution error",
};

const NOTICE =
  "This exam records how many times you switch tabs and paste text. Your teacher sees these counts. " +
  "They are context for review, not proof of any wrongdoing.";

function Centered({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-app px-4">{children}</div>;
}

// key={roomId} resets everything when the room changes
export default function ExamPage() {
  const { roomId } = useParams();
  return <ExamView key={roomId} roomId={roomId} />;
}

function ExamView({ roomId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let active = true;
    getExam(roomId)
      .then((d) => active && setData(d))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [roomId]);

  const reload = () => getExam(roomId).then(setData).catch((err) => setError(err.message));

  const start = async () => {
    setStarting(true);
    setNotice("");
    try {
      const res = await startExam(roomId);
      setData((d) => ({ ...d, problem: res.problem, session: res.session, serverNow: res.serverNow }));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setStarting(false);
    }
  };

  if (error) {
    return (
      <Centered>
        <EmptyState icon={FolderX} title={error} text="Open a Lab Exam room to take an exam.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </Centered>
    );
  }

  if (!data) {
    return (
      <Centered>
        <p className="text-muted">Preparing your exam...</p>
      </Centered>
    );
  }

  if (data.myRole === "owner") {
    return (
      <Centered>
        <EmptyState icon={ShieldAlert} title="Students only" text="You own this exam. Review student work on the Submissions page.">
          <Button to={`/room/${roomId}/submissions`}>View submissions</Button>
        </EmptyState>
      </Centered>
    );
  }

  if (!data.exam) {
    return (
      <Centered>
        <EmptyState icon={ClipboardList} title="No exam yet" text="Your teacher has not set up the exam.">
          <Button variant="secondary" onClick={reload}>
            <RefreshCw size={16} /> Check again
          </Button>
        </EmptyState>
      </Centered>
    );
  }

  const { exam, session } = data;

  // ---- not started ----
  if (!session) {
    return (
      <Centered>
        <div className="w-full max-w-lg space-y-5 rounded-xl border border-line bg-surface p-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{data.room.name}</p>
            <h1 className="text-2xl font-bold text-ink">{exam.title}</h1>
          </div>
          <p className="text-sm text-muted">
            You have <b className="text-ink">{exam.durationMinutes} minutes</b> once you start. The timer runs on the
            server, so refreshing or closing the page does not pause it. If time runs out, your work is submitted
            automatically.
          </p>
          <TelemetryNotice>{NOTICE}</TelemetryNotice>
          {notice && <p className="text-sm text-red-400">{notice}</p>}
          {exam.open ? (
            <Button onClick={start} disabled={starting} className="w-full">
              {starting ? "Starting..." : "Start exam"}
            </Button>
          ) : (
            <>
              <p className="text-sm text-amber-400">The teacher has not opened the exam yet.</p>
              <Button variant="secondary" onClick={reload} className="w-full">
                <RefreshCw size={16} /> Check again
              </Button>
            </>
          )}
        </div>
      </Centered>
    );
  }

  // ---- finished ----
  if (session.submittedAt) {
    const graded = session.grade !== null && session.grade !== undefined;
    return (
      <Centered>
        <div className="w-full max-w-md space-y-3 rounded-xl border border-line bg-surface p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-green-400" />
          <h1 className="text-xl font-bold text-ink">Submitted</h1>
          <p className="text-sm text-muted">
            {session.submitReason === "timeout"
              ? "Time ran out, so your work was submitted automatically."
              : "Your solution was submitted."}
          </p>
          {graded ? (
            <div className="rounded-lg border border-line bg-app p-3 text-left text-sm">
              <p className="font-semibold text-ink">Grade: {session.grade}/100</p>
              {session.feedback && <p className="mt-1 text-muted">Feedback: {session.feedback}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted">Not graded yet.</p>
          )}
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="secondary" onClick={reload}>
              <RefreshCw size={16} /> Refresh result
            </Button>
            <Button to="/dashboard">Back to dashboard</Button>
          </div>
        </div>
      </Centered>
    );
  }

  // ---- running ----
  return (
    <ExamWorkspace
      key={session.startedAt}
      roomId={roomId}
      roomName={data.room.name}
      title={exam.title}
      fileName={data.fileName}
      problem={data.problem}
      session={session}
      serverNow={data.serverNow}
      onSubmitted={(s) => setData((d) => ({ ...d, session: s }))}
    />
  );
}

function ExamWorkspace({ roomId, roomName, title, fileName, problem, session, serverNow, onSubmitted }) {
  const { theme } = useTheme();
  // The countdown uses the SERVER's clock, so a wrong local clock changes nothing
  const remaining = useCountdown(new Date(session.endsAt).getTime(), serverNow);
  const timeUp = remaining <= 0;

  const [code, setCode] = useState(session.code);
  const [saveState, setSaveState] = useState("saved");
  const [counts, setCounts] = useState({ tabSwitches: session.tabSwitches, pastes: session.pastes });
  const [output, setOutput] = useState([]);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [problems, setProblems] = useState([]);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const codeRef = useRef(session.code); // always the latest text, for timers and submit
  const sentRef = useRef(false); // blocks a double submit
  const timers = useRef({ save: null });

  const locked = timeUp || submitting;

  // ---- autosave, 2 seconds after the last keystroke ----
  const flush = useCallback(async () => {
    try {
      await saveCode(roomId, codeRef.current);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [roomId]);

  const handleChange = (value) => {
    const next = value ?? "";
    setCode(next);
    codeRef.current = next;
    setSaveState("saving");
    clearTimeout(timers.current.save);
    timers.current.save = setTimeout(flush, SAVE_DELAY_MS);
  };

  useEffect(() => {
    const holder = timers.current;
    return () => clearTimeout(holder.save);
  }, []);

  // ---- disclosed telemetry: the SERVER counts, we only report ----
  const notify = useCallback(
    (type) => {
      sendEvent(roomId, type)
        .then((c) => setCounts({ tabSwitches: c.tabSwitches, pastes: c.pastes }))
        .catch(() => {});
    },
    [roomId]
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) notify("tab");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [notify]);

  // ---- submit ----
  const submit = async () => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSubmitting(true);
    clearTimeout(timers.current.save);
    try {
      const res = await submitExam(roomId, codeRef.current);
      onSubmitted(res.session);
    } catch (err) {
      sentRef.current = false;
      setMessage(`${err.message}. If time is up, the server submits your last saved work for you.`);
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    if (window.confirm("Submit your solution? You cannot change it afterwards.")) submit();
  };

  // When the timer reaches zero, submit (the server also does this if the browser is closed)
  useEffect(() => {
    if (!timeUp) return;
    const id = setTimeout(() => submit(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  // ---- Monaco problems ----
  const handleProblems = (markers) => {
    setProblems(
      markers
        .filter((m) => m.severity >= 4)
        .map((m) => ({
          message: m.message,
          line: m.startLineNumber,
          column: m.startColumn,
          severity: m.severity === 8 ? "error" : "warning",
        }))
    );
  };

  // ---- run ----
  const loadHistory = async () => {
    try {
      setHistory(await listRuns(roomId));
    } catch {
      // history is optional
    }
  };

  const handleRun = async () => {
    setRunning(true);
    const add = (...lines) => setOutput((o) => [...o, ...lines]);
    add({ kind: "info", text: `> Running ${fileName}` });
    try {
      const run = await runCode(roomId, { fileName, code: codeRef.current, stdin });
      if (run.compileOutput) add({ kind: "err", text: run.compileOutput });
      if (run.stdout) add({ kind: "out", text: run.stdout });
      if (run.stderr) add({ kind: "err", text: run.stderr });
      add({ kind: "info", text: `${STATUS_LABEL[run.status]} · ${run.timeMs} ms · ${run.memoryKb} KB` });
      loadHistory();
    } catch (err) {
      add({ kind: "err", text: err.message });
    } finally {
      setRunning(false);
    }
  };

  const saveText =
    saveState === "saving" ? "Saving..." : saveState === "error" ? "Could not save. Check your connection." : "All changes saved";

  return (
    <div className="flex h-screen flex-col bg-app">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <h1 className="truncate text-sm font-semibold text-ink">
          {roomName} · {title}
        </h1>
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
        <aside className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-b border-line bg-surface p-5 lg:max-h-none lg:w-96 lg:border-b-0 lg:border-r">
          <TelemetryNotice>{NOTICE}</TelemetryNotice>
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{problem}</p>
          </div>
          <p className="text-xs text-muted">
            Tab switches: {counts.tabSwitches} · Pastes: {counts.pastes}
          </p>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Editor
              path="exam-solution"
              language={monacoLanguage(fileName)}
              value={code}
              theme={theme === "dark" ? "vs-dark" : "light"}
              loading={<p className="text-sm text-muted">Loading editor...</p>}
              onChange={handleChange}
              onMount={(ed) => ed.onDidPaste(() => notify("paste"))}
              onValidate={handleProblems}
              options={{
                readOnly: locked,
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                padding: { top: 12 },
              }}
            />
          </div>

          <BottomPanel
            output={output}
            stdin={stdin}
            onStdinChange={setStdin}
            onClearOutput={() => setOutput([])}
            problems={problems}
            history={history}
            onOpenHistory={loadHistory}
          />

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2">
            <p className={`text-xs ${message || saveState === "error" ? "text-red-400" : "text-muted"}`}>
              {message || saveText}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRun} disabled={locked || running}>
                <Play size={16} /> {running ? "Running..." : "Run"}
              </Button>
              <Button onClick={confirmSubmit} disabled={locked}>
                <Send size={16} /> {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}