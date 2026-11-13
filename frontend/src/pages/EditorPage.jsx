import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { FolderX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import useWorkspace from "../hooks/useWorkspace";
import useRoomSocket from "../hooks/useRoomSocket";
import useCollab from "../hooks/useCollab";
import useChat from "../hooks/useChat";
import useHand from "../hooks/useHand";
import useTask from "../hooks/useTask";
import EditorToolbar from "../components/editor/EditorToolbar";
import FileExplorer from "../components/editor/FileExplorer";
import EditorTabs from "../components/editor/EditorTabs";
import CodeArea from "../components/editor/CodeArea";
import BottomPanel from "../components/editor/BottomPanel";
import ParticipantsPanel from "../components/editor/ParticipantsPanel";
import ShareModal from "../components/editor/ShareModal";
import TaskBar from "../components/classroom/TaskBar";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import { loadEditorSettings, saveEditorSettings } from "../utils/editorSettings";
import { runCode, listRuns } from "../services/executionService";

// key={roomId} makes React start fresh when you move to a different room
export default function EditorPage() {
  const { roomId } = useParams();
  return <Workspace key={roomId} roomId={roomId} />;
}

const STATUS_LABEL = {
  success: "Finished",
  compile_error: "Compilation failed",
  runtime_error: "Runtime error",
  timeout: "Time limit exceeded",
  error: "Execution error",
};

function Workspace({ roomId }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const ws = useWorkspace(roomId, params.get("file"));
  const live = useRoomSocket(roomId);

  // Can the current user type in the open file? (role, classroom ownership and lock)
  const fileEditable =
    ws.canEdit && (!ws.classroomStudent || ws.activeFile?.owner === user.id);

  const hand = useHand({
    socketRef: live.socketRef,
    status: live.status,
    roomId,
    userId: user.id,
    enabled: ws.classroomStudent && ws.room?.myRole === "editor",
  });

  const taskState = useTask({
    socketRef: live.socketRef,
    status: live.status,
    roomId,
    enabled: ws.classroomStudent,
  });

  const [output, setOutput] = useState([]);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [problems, setProblems] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(loadEditorSettings);
  const [showShare, setShowShare] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const editorRef = useRef(null); // holds the Monaco editor instance
  const [editor, setEditor] = useState(null); // triggers the collab hook when Monaco is ready

  useCollab({
    socketRef: live.socketRef,
    status: live.status,
    roomId,
    fileId: ws.activeFile?.id,
    editor,
    canEdit: fileEditable,
    user,
  });

  const chat = useChat({
    socketRef: live.socketRef,
    status: live.status,
    roomId,
    panelOpen: chatOpen,
  });

  const { refreshMembers } = ws;

  // Tell the server which file is open, so others can see it in the file list
  useEffect(() => {
    if (live.status !== "connected") return;
    live.socketRef.current?.emit("file:focus", {
      roomId,
      fileId: ws.activeFile?.id ?? null,
    });
  }, [live.status, live.socketRef, roomId, ws.activeFile?.id]);

  // The server says members, roles or files changed: reload them
  useEffect(() => {
    const socket = live.socketRef.current;
    if (!socket || live.status !== "connected") return;

    const onChanged = (msg) => {
      if (msg.roomId === roomId) refreshMembers();
    };
    socket.on("room:changed", onChanged);
    return () => socket.off("room:changed", onChanged);
  }, [live.status, live.socketRef, roomId, refreshMembers]);

  const changeSettings = (next) => {
    setSettings(next);
    saveEditorSettings(next);
  };

  const handleFormat = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  // Monaco gives markers with severity numbers: 8 = error, 4 = warning
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

  // ---- Everything below may return early, so no hooks go below this line ----

  if (ws.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app text-muted">
        Loading workspace...
      </div>
    );
  }

  if (ws.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-app px-4">
        <EmptyState icon={FolderX} title={ws.error} text="This room may have been deleted or you don't have access.">
          <Button to="/dashboard">Back to dashboard</Button>
        </EmptyState>
      </div>
    );
  }

    // Exam students work on the exam page, never in the shared editor
  if (ws.room.mode === "exam" && ws.room.myRole !== "owner") {
    return <Navigate to={`/room/${roomId}/exam`} replace />;
  }
  

  const loadHistory = async () => {
    try {
      setHistory(await listRuns(roomId));
    } catch {
      // history is optional; the Run output still works without it
    }
  };

  const handleRun = async () => {
    if (!ws.activeFile) return;
    setRunning(true);
    const { name, content } = ws.activeFile;
    const add = (...lines) => setOutput((o) => [...o, ...lines]);

    add({ kind: "info", text: `> Running ${name}` });
    try {
      const run = await runCode(roomId, { fileName: name, code: content, stdin });
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

  const onlineIds = new Set(live.online.map((u) => u.id));
  const people = ws.participants.map((p) => ({
    ...p,
    name: p.id === user.id ? `${p.name} (you)` : p.name,
    online: onlineIds.has(p.id),
  }));

  // fileId -> other people currently viewing that file
  const viewersByFile = {};
  live.online.forEach((u) => {
    if (u.id !== user.id && u.fileId) (viewersByFile[u.fileId] ||= []).push(u);
  });

  return (
    <div className="flex h-screen flex-col bg-app">
      <EditorToolbar
        room={ws.room}
        activeFile={ws.activeFile}
        running={running}
        onRun={handleRun}
        isTeacher={user.role === "teacher"}
        saveState={live.status === "connected" ? "saved" : live.status === "error" ? "error" : "offline"}
        settings={settings}
        onSettingsChange={changeSettings}
        onFormat={handleFormat}
        canEdit={fileEditable}
        showHand={ws.classroomStudent && ws.room.myRole === "editor"}
        handRaised={hand.raised}
        onRaiseHand={hand.toggle}
        onShare={() => setShowShare(true)}
      />

      <div className="flex min-h-0 flex-1">
        <FileExplorer
          files={ws.files}
          activeId={ws.activeFile?.id}
          canEdit={ws.canManageFiles}
          viewersByFile={viewersByFile}
          onOpen={ws.openFile}
          onCreate={ws.createFile}
          onRename={ws.renameFile}
          onDelete={ws.deleteFile}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {ws.classroomStudent && (
            <TaskBar
              task={taskState.task}
              submission={taskState.submission}
              canSubmit={ws.room.myRole === "editor"}
              onSubmit={taskState.submit}
            />
          )}
          {ws.classroomStudent && ws.room.locked && (
            <p className="shrink-0 bg-amber-500/15 px-4 py-1.5 text-xs text-amber-400">
              The teacher has locked editing. You can read your code but not change it.
            </p>
          )}
          {live.status !== "connected" && (
            <p className="shrink-0 bg-amber-500/15 px-4 py-1.5 text-xs text-amber-400">
              {live.status === "error"
                ? "Connection error. Editing is paused. Try refreshing the page."
                : live.status === "reconnecting"
                  ? "Connection lost. Reconnecting... Editing is paused so nothing is lost."
                  : "Connecting..."}
            </p>
          )}
          <EditorTabs
            openFiles={ws.openFiles}
            activeId={ws.activeFile?.id}
            onSelect={ws.openFile}
            onClose={ws.closeTab}
          />
          <CodeArea
            file={ws.activeFile}
            onChange={ws.updateContent}
            readOnly={!fileEditable || live.status !== "connected"}
            editorTheme={settings.theme}
            fontSize={settings.fontSize}
            onMount={(ed) => {
              editorRef.current = ed;
              setEditor(ed);
            }}
            onProblems={handleProblems}
          />
          <BottomPanel
            output={output}
            stdin={stdin}
            onStdinChange={setStdin}
            onClearOutput={() => setOutput([])}
            problems={problems}
            history={history}
            onOpenHistory={loadHistory}
          />
        </main>

        <ParticipantsPanel
          participants={people}
          chat={chat}
          meId={user.id}
          disabled={live.status !== "connected"}
          onTabChange={(name) => setChatOpen(name === "chat")}
        />
      </div>

      {showShare && <ShareModal roomId={roomId} onClose={() => setShowShare(false)} />}
    </div>
  );
}