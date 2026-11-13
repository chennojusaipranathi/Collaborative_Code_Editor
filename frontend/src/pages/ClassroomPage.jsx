import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, ClipboardList, FolderX, Lock, LockOpen, Pencil, ShieldAlert, Trash2, Users,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import StudentCard from "../components/classroom/StudentCard";
import TaskModal from "../components/classroom/TaskModal";
import SubmissionModal from "../components/classroom/SubmissionModal";
import useAuth from "../hooks/useAuth";
import useClassroom from "../hooks/useClassroom";
import useRoomSocket from "../hooks/useRoomSocket";
import { deleteTask } from "../services/taskService";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "hand", label: "Hand raised" },
  { key: "coding", label: "Coding" },
  { key: "idle", label: "Idle" },
  { key: "submitted", label: "Submitted" },
  { key: "offline", label: "Offline" },
];

function matches(student, key) {
  if (key === "all") return true;
  if (key === "hand") return student.handRaised;
  return student.status === key;
}

// The role check lives here for a good experience. The server enforces it on every request.
export default function ClassroomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();

  if (user.role !== "teacher") {
    return (
      <AppShell>
        <EmptyState icon={ShieldAlert} title="Teachers only" text="Only teachers can monitor a classroom.">
          <Button to={`/room/${roomId}`}>Back to the room</Button>
        </EmptyState>
      </AppShell>
    );
  }

  return <ClassroomView key={roomId} roomId={roomId} />;
}

function ClassroomView({ roomId }) {
  const live = useRoomSocket(roomId);
  const { data, loading, error, toggleLock, dismissHand, setTask } = useClassroom(
    roomId,
    live.socketRef,
    live.status
  );
  const [filter, setFilter] = useState("all");
  const [toggling, setToggling] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [viewing, setViewing] = useState(null); // the student whose submission is open

  if (loading) {
    return (
      <AppShell>
        <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-64 rounded-xl bg-line" />)}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <EmptyState icon={FolderX} title={error} text="Open a Classroom-mode room that you own.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </AppShell>
    );
  }

  const { room, task, students } = data;
  const locked = room.locked;
  const online = students.filter((s) => s.status !== "offline").length;
  const hands = students.filter((s) => s.handRaised).length;
  const submitted = students.filter((s) => s.status === "submitted").length;
  const visible = students.filter((s) => matches(s, filter));

  const handleToggleLock = async () => {
    setToggling(true);
    try {
      await toggleLock();
    } finally {
      setToggling(false);
    }
  };

  const removeTask = async () => {
    if (!window.confirm("Remove this task? Its submissions will be deleted too.")) return;
    try {
      await deleteTask(roomId);
      setTask(null);
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={`/room/${roomId}`} className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft size={14} /> Back to editor
          </Link>
          <h1 className="text-2xl font-bold text-ink">{room.name}</h1>
          <p className="text-sm text-muted">Classroom monitoring</p>
        </div>
        <Button variant={locked ? "primary" : "secondary"} onClick={handleToggleLock} disabled={toggling}>
          {locked ? <LockOpen size={16} /> : <Lock size={16} />}
          {locked ? "Unlock editing" : "Lock editing"}
        </Button>
      </div>

      {locked && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
          Editing is locked. Students can view their code but cannot type.
        </p>
      )}

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        {task ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted">
                Assigned task ·{" "}
                {task.deadline ? `due ${new Date(task.deadline).toLocaleString()}` : "no deadline"}
                {task.closed && <span className="ml-2 text-red-400">closed</span>}
              </p>
              <h2 className="font-semibold text-ink">{task.title}</h2>
              {task.description && (
                <p className="whitespace-pre-wrap text-sm text-muted">{task.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowTask(true)}>
                <Pencil size={14} /> Edit
              </Button>
              <Button variant="secondary" onClick={removeTask}>
                <Trash2 size={14} /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">No task assigned yet. Students will see it as soon as you assign one.</p>
            <Button onClick={() => setShowTask(true)}>
              <ClipboardList size={16} /> Assign task
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Online", value: `${online}/${students.length}` },
          { label: "Hands raised", value: hands },
          { label: "Submitted", value: `${submitted}/${students.length}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-indigo-400 bg-indigo-500/15 text-indigo-400"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Users} title="No students in this view" text="Students appear here after they join with the room code." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              roomId={roomId}
              onDismissHand={dismissHand}
              onViewSubmission={setViewing}
            />
          ))}
        </div>
      )}

      {showTask && (
        <TaskModal roomId={roomId} task={task} onClose={() => setShowTask(false)} onSaved={setTask} />
      )}
      {viewing && (
        <SubmissionModal roomId={roomId} student={viewing} onClose={() => setViewing(null)} />
      )}
    </AppShell>
  );
}