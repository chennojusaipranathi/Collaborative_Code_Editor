import { useState } from "react";
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

// key={roomId} makes React start fresh when you move to a different room
export default function EditorPage() {
  const { roomId } = useParams();
  return <Workspace key={roomId} roomId={roomId} />;
}

function Workspace({ roomId }) {
  const { user } = useAuth();
  const ws = useWorkspace(roomId);

  const [output, setOutput] = useState([]);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);

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

  const problems =
    ws.activeFile && ws.activeFile.content.trim() === ""
      ? [`${ws.activeFile.name} is empty`]
      : [];

  // Put the current user first in the participants list
  const people = [{ id: user.id, name: `${user.name} (you)`, role: "owner", online: true }, ...ws.participants];

  return (
    <div className="flex h-screen flex-col bg-app">
      <EditorToolbar room={ws.room} activeFile={ws.activeFile} running={running} onRun={handleRun}  isTeacher={user.role === "teacher"} />

      <div className="flex min-h-0 flex-1">
        <FileExplorer
          files={ws.files}
          activeId={ws.activeFile?.id}
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
          <CodeArea file={ws.activeFile} onChange={ws.updateContent} />
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