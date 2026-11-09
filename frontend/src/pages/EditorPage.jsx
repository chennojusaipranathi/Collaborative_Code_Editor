import { useParams } from "react-router-dom";
import { FolderX } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useWorkspace from "../hooks/useWorkspace";
import EditorToolbar from "../components/editor/EditorToolbar";
import FileExplorer from "../components/editor/FileExplorer";
import EditorTabs from "../components/editor/EditorTabs";
import CodeArea from "../components/editor/CodeArea";
import BottomPanel from "../components/editor/BottomPanel";
import ParticipantsPanel from "../components/editor/ParticipantsPanel";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import { languageFromFileName } from "../utils/fileLanguage";
import { loadEditorSettings, saveEditorSettings } from "../utils/editorSettings";
import useRoomSocket from "../hooks/useRoomSocket";
import { useRef, useState } from "react";
import useCollab from "../hooks/useCollab";


// key={roomId} makes React start fresh when you move to a different room
export default function EditorPage() {
  const { roomId } = useParams();
  return <Workspace key={roomId} roomId={roomId} />;
}

function Workspace({ roomId }) {
  const { user } = useAuth();
  const ws = useWorkspace(roomId);
  const live = useRoomSocket(roomId);

  const [output, setOutput] = useState([]);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [problems, setProblems] = useState([]);
  const [settings, setSettings] = useState(loadEditorSettings);
  const editorRef = useRef(null); // holds the Monaco editor instance
  const [editor, setEditor] = useState(null); // triggers the collab hook when Monaco is ready


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

    useCollab({
    socketRef: live.socketRef,
    status: live.status,
    roomId,
    fileId: ws.activeFile?.id,
    editor,
    canEdit: ws.canEdit,
  });

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

  // MOCK run: real execution (Judge0) is added in Phase 7
  const handleRun = async () => {
    setRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const language = languageFromFileName(ws.activeFile.name);
    setOutput((lines) => [
      ...lines,
      `> Running ${ws.activeFile.name} (${language})`,
      `[mock] stdin received: ${stdin ? JSON.stringify(stdin) : "(empty)"}`,
      "[mock] Real code execution is added in Phase 7.",
    ]);
    setRunning(false);
  };

  const onlineIds = new Set(live.online.map((u) => u.id));
  const people = ws.participants.map((p) => ({
    ...p,
    name: p.id === user.id ? `${p.name} (you)` : p.name,
    online: onlineIds.has(p.id),
  }));
  return (
    <div className="flex h-screen flex-col bg-app">
      <EditorToolbar
        room={ws.room}
        activeFile={ws.activeFile}
        running={running}
        onRun={handleRun}
        isTeacher={user.role === "teacher"}
        saveState={ws.saveState}
        settings={settings}
        onSettingsChange={changeSettings}
        onFormat={handleFormat}
        canEdit={ws.canEdit}
      />

      <div className="flex min-h-0 flex-1">
        <FileExplorer
          files={ws.files}
          activeId={ws.activeFile?.id}
          canEdit={ws.canEdit}
          onOpen={ws.openFile}
          onCreate={ws.createFile}
          onRename={ws.renameFile}
          onDelete={ws.deleteFile}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <EditorTabs
            openFiles={ws.openFiles}
            activeId={ws.activeFile?.id}
            onSelect={ws.openFile}
            onClose={ws.closeTab}
          />
          <CodeArea
            file={ws.activeFile}
            onChange={ws.updateContent}
            readOnly={!ws.canEdit}
            editorTheme={settings.theme}
            fontSize={settings.fontSize}
            onMount={(ed) => { editorRef.current = ed; setEditor(ed); }}
            onProblems={handleProblems}
          />
          <BottomPanel
            output={output}
            stdin={stdin}
            onStdinChange={setStdin}
            onClearOutput={() => setOutput([])}
            problems={problems}
          />
        </main>

        <ParticipantsPanel participants={people} />
      </div>
    </div>
  );
}