import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderX, Inbox, RefreshCw, ScanSearch } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import TelemetryNotice from "../components/common/TelemetryNotice";
import ReviewModal from "../components/exam/ReviewModal";
import { getSimilarity, listSessions } from "../services/examApi";

const POLL_MS = 5000;

const STATUS = {
  not_started: { label: "Not started", badge: "bg-slate-500/15 text-muted" },
  coding: { label: "Coding", badge: "bg-green-500/15 text-green-400" },
  idle: { label: "Idle", badge: "bg-amber-500/15 text-amber-400" },
  submitted: { label: "Submitted", badge: "bg-indigo-500/15 text-indigo-400" },
};

// key={roomId} resets everything when the room changes
export default function SubmissionsPage() {
  const { roomId } = useParams();
  return <MonitorView key={roomId} roomId={roomId} />;
}

function MonitorView({ roomId }) {
  const [data, setData] = useState(null); // { exam, serverNow, students }
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [similarity, setSimilarity] = useState(null); // studentId -> { percent, withName }
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState("");
  const [reviewing, setReviewing] = useState(null);

  // Load now, then every 5 seconds. Changing refreshKey loads again at once.
  useEffect(() => {
    let active = true;
    const run = () =>
      listSessions(roomId)
        .then((d) => {
          if (!active) return;
          setData(d);
          setError("");
        })
        .catch((err) => active && setError(err.message));

    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [roomId, refreshKey]);

  const checkSimilarity = async () => {
    setSimBusy(true);
    setSimError("");
    try {
      const results = await getSimilarity(roomId);
      setSimilarity(new Map(results.map((r) => [r.studentId, r])));
    } catch (err) {
      setSimError(err.message);
    } finally {
      setSimBusy(false);
    }
  };

  // Update one row at once after grading (the next refresh would also catch it)
  const markGraded = (studentId, grade, feedback) =>
    setData((d) => ({
      ...d,
      students: d.students.map((s) => (s.id === studentId ? { ...s, grade, feedback } : s)),
    }));

  if (!data && error) {
    return (
      <AppShell>
        <EmptyState icon={FolderX} title={error} text="Only the owner of a Lab Exam room can open this page.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((n) => <div key={n} className="h-14 rounded-xl bg-line" />)}
        </div>
      </AppShell>
    );
  }

  const { exam, students } = data;

  const count = (key) => students.filter((s) => s.status === key).length;
  const graded = students.filter((s) => s.grade !== null).length;

  return (
    <AppShell>
      <Link to={`/room/${roomId}/exam`} className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to exam
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{exam ? exam.title : "Exam monitor"}</h1>
          <p className="text-sm text-muted">
            {exam
              ? `${exam.durationMinutes} minutes · ${exam.open ? "open" : "closed"} · refreshes every 5 seconds`
              : "No exam has been set up yet."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={checkSimilarity} disabled={simBusy || !exam}>
            <ScanSearch size={16} /> {simBusy ? "Comparing..." : "Check similarity"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <TelemetryNotice>
          Tab switches and paste counts are disclosed to students and are context only, not proof of cheating.
          Similarity is a <strong>basic text-overlap estimate</strong> between submitted solutions. It can flag
          short or common solutions by chance, so a high value is a reason to read the code, not a verdict.
        </TelemetryNotice>
      </div>

      {simError && <p className="mb-4 text-sm text-red-400">{simError}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Not started", value: count("not_started") },
          { label: "Working", value: count("coding") + count("idle") },
          { label: "Submitted", value: count("submitted") },
          { label: "Graded", value: graded },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No students yet"
          text="Students appear here after they join with the room code or an invite link."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tabs / Pastes</th>
                <th className="px-4 py-3">Similarity (estimate)</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const st = STATUS[s.status];
                const sim = similarity?.get(s.id);
                return (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.badge}`}>
                        {st.label}
                      </span>
                      {s.submitReason === "timeout" && (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                          auto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {s.status === "not_started" ? "-" : `${s.tabSwitches} / ${s.pastes}`}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {!similarity
                        ? "-"
                        : !sim
                          ? "Not compared"
                          : sim.percent === null
                            ? "Too little code"
                            : `${sim.percent}%${sim.withName ? ` with ${sim.withName}` : ""}`}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {s.grade === null ? <span className="text-muted">Not graded</span> : `${s.grade}/100`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== "not_started" && (
                        <button onClick={() => setReviewing(s)} className="text-indigo-400 hover:underline">
                          {s.status === "submitted" ? "Review" : "View"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          roomId={roomId}
          student={reviewing}
          onClose={() => setReviewing(null)}
          onGraded={markGraded}
        />
      )}
    </AppShell>
  );
}