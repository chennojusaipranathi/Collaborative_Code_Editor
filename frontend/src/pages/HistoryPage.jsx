import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Camera, RotateCcw, History as HistoryIcon, FolderX } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import SnapshotList from "../components/history/SnapshotList";
import DiffView from "../components/history/DiffView";
import CreateSnapshotModal from "../components/history/CreateSnapshotModal";
import useAuth from "../hooks/useAuth";
import useHistory from "../hooks/useHistory";
import { diffLines } from "../utils/diffLines";

// key={roomId} resets everything when the room changes
export default function HistoryPage() {
  const { roomId } = useParams();
  return <HistoryView key={roomId} roomId={roomId} />;
}

function HistoryView({ roomId }) {
  const { data, loading, error, createSnapshot, restore } = useHistory(roomId);

  if (loading) {
    return (
      <AppShell>
        <div className="grid animate-pulse gap-4 lg:grid-cols-[20rem_1fr]">
          <div className="space-y-2">
            {[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-xl bg-line" />)}
          </div>
          <div className="h-80 rounded-xl bg-line" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <EmptyState icon={FolderX} title={error} text="This room may have been deleted or you don't have access.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </AppShell>
    );
  }

  return (
    <HistoryContent roomId={roomId} data={data} onCreate={createSnapshot} onRestore={restore} />
  );
}

function HistoryContent({ roomId, data, onCreate, onRestore }) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(data.snapshots[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");
  const [restoring, setRestoring] = useState(false);

  const selected = data.snapshots.find((s) => s.id === selectedId) ?? null;

  // Recalculated only when the selected snapshot or the current code changes
  const current = data.current;
  const rows = useMemo(
    () => (selected ? diffLines(selected.content, current) : []),
    [selected, current]
  );
  const added = rows.filter((r) => r.type === "added").length;
  const removed = rows.filter((r) => r.type === "removed").length;
  const identical = added === 0 && removed === 0;

  const handleRestore = async () => {
    const ok = window.confirm(
      `Restore "${selected.label}"? Your current code is saved as a backup snapshot first.`
    );
    if (!ok) return;
    setRestoring(true);
    try {
      await onRestore(selected.id);
      setNotice(`Restored "${selected.label}". A backup snapshot was saved.`);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={`/room/${roomId}`} className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft size={14} /> Back to editor
          </Link>
          <h1 className="text-2xl font-bold text-ink">Version history</h1>
          <p className="text-sm text-muted">
            {data.room.name} · <span className="font-mono">{data.fileName}</span>
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Camera size={16} /> Save snapshot
        </Button>
      </div>

      {notice && (
        <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          {notice}
        </p>
      )}

      {data.snapshots.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No snapshots yet" text="Save a snapshot to keep a copy of your code.">
          <Button onClick={() => setShowCreate(true)}>Save snapshot</Button>
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <SnapshotList snapshots={data.snapshots} selectedId={selectedId} onSelect={setSelectedId} />

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{selected.label}</h2>
                <p className="text-xs text-muted">
                  {selected.author} · {new Date(selected.createdAt).toLocaleString()} ·{" "}
                  {identical ? "Same as current code" : `+${added} added, -${removed} removed vs current`}
                </p>
              </div>
              <Button variant="secondary" onClick={handleRestore} disabled={identical || restoring}>
                <RotateCcw size={16} /> {restoring ? "Restoring..." : "Restore this version"}
              </Button>
            </div>

            <DiffView rows={rows} oldTitle={`Snapshot: ${selected.label}`} newTitle="Current code" />
            <p className="mt-2 text-xs text-muted">
              Red lines exist only in the snapshot. Green lines exist only in the current code.
            </p>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateSnapshotModal
          onClose={() => setShowCreate(false)}
          onCreate={(label) => onCreate(label, user.name)}
        />
      )}
    </AppShell>
  );
}