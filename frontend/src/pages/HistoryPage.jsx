import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { DiffEditor } from "@monaco-editor/react";
import { ArrowLeft, Camera, RefreshCw, RotateCcw, History as HistoryIcon, FolderX } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import SnapshotList from "../components/history/SnapshotList";
import CreateSnapshotModal from "../components/history/CreateSnapshotModal";
import useTheme from "../hooks/useTheme";
import useHistory from "../hooks/useHistory";
import { getRoomInfo, getSnapshot } from "../services/historyService";
import { monacoLanguage } from "../utils/fileLanguage";

// key={roomId} resets everything when the room changes
export default function HistoryPage() {
  const { roomId } = useParams();
  return <HistoryView key={roomId} roomId={roomId} />;
}

function HistoryView({ roomId }) {
  const [params, setParams] = useSearchParams();
  const [info, setInfo] = useState(null); // { room, files }
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getRoomInfo(roomId)
      .then((result) => active && setInfo(result))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [roomId]);

  if (error) {
    return (
      <AppShell>
        <EmptyState icon={FolderX} title={error} text="This room may have been deleted or you don't have access.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </AppShell>
    );
  }

  if (!info) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-xl bg-line" />
      </AppShell>
    );
  }

  const { room, files } = info;
  const file = files.find((f) => f.id === params.get("file")) ?? files[0];

  if (!file) {
    return (
      <AppShell>
        <EmptyState icon={HistoryIcon} title="No files in this room" text="Create a file in the editor first.">
          <Button to={`/room/${roomId}`}>Back to editor</Button>
        </EmptyState>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to={`/room/${roomId}`} className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to editor
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Version history</h1>
          <p className="text-sm text-muted">{room.name}</p>
        </div>
        <select
          value={file.id}
          onChange={(e) => setParams({ file: e.target.value })}
          aria-label="Choose a file"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
        >
          {files.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* key remounts the content when the file changes, so state never leaks between files */}
      <HistoryContent key={file.id} roomId={roomId} file={file} canEdit={room.myRole !== "viewer"} />
    </AppShell>
  );
}

function HistoryContent({ roomId, file, canEdit }) {
  const { data, loading, error, refresh, create, restore } = useHistory(roomId, file.id);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");
  const [restoring, setRestoring] = useState(false);

  if (loading) {
    return (
      <div className="grid animate-pulse gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-2">
          {[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-xl bg-line" />)}
        </div>
        <div className="h-80 rounded-xl bg-line" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  const { snapshots, current } = data;
  const selected = snapshots.find((s) => s.id === selectedId) ?? snapshots[0] ?? null;

  const handleRestore = async () => {
    if (!window.confirm(`Restore "${selected.label}"? The current text is saved as a backup snapshot first.`)) return;
    setRestoring(true);
    try {
      await restore(selected.id);
      setNotice(`Restored "${selected.label}". Everyone in the room now sees this version.`);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {canEdit && (
          <Button onClick={() => setShowCreate(true)}>
            <Camera size={16} /> Save snapshot
          </Button>
        )}
        <Button variant="secondary" onClick={refresh}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      {notice && (
        <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          {notice}
        </p>
      )}

      {snapshots.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No snapshots yet"
          text="Automatic snapshots appear after you edit. You can also save one yourself."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <SnapshotList snapshots={snapshots} selectedId={selected.id} onSelect={setSelectedId} />
          {/* key reloads the snapshot's text when you pick another one */}
          <SnapshotDiff
            key={selected.id}
            roomId={roomId}
            file={file}
            snapshot={selected}
            current={current ?? ""}
            canEdit={canEdit}
            restoring={restoring}
            onRestore={handleRestore}
          />
        </div>
      )}

      {showCreate && <CreateSnapshotModal onClose={() => setShowCreate(false)} onCreate={create} />}
    </>
  );
}

function SnapshotDiff({ roomId, file, snapshot, current, canEdit, restoring, onRestore }) {
  const { theme } = useTheme();
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSnapshot(roomId, file.id, snapshot.id)
      .then((s) => active && setContent(s.content))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [roomId, file.id, snapshot.id]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (content === null) return <div className="h-80 animate-pulse rounded-xl bg-line" />;

  const identical = content === current;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">{snapshot.label}</h2>
          <p className="text-xs text-muted">
            {snapshot.author} · {new Date(snapshot.createdAt).toLocaleString()} ·{" "}
            {identical ? "Same as current text" : "Differs from current text"}
          </p>
        </div>
        {canEdit && (
          <Button variant="secondary" onClick={onRestore} disabled={identical || restoring}>
            <RotateCcw size={16} /> {restoring ? "Restoring..." : "Restore this version"}
          </Button>
        )}
      </div>

      <div className="mb-1 grid grid-cols-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>Snapshot</span>
        <span>Current text</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <DiffEditor
          height="60vh"
          original={content}
          modified={current}
          language={monacoLanguage(file.name)}
          theme={theme === "dark" ? "vs-dark" : "light"}
          loading={<p className="text-sm text-muted">Loading comparison...</p>}
          options={{
            readOnly: true,
            renderSideBySide: true,
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}