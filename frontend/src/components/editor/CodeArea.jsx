import { FileX } from "lucide-react";
import MonacoEditor from "./MonacoEditor";

export default function CodeArea({ file, onChange, readOnly = false }) {
  if (!file) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted">
        <FileX size={36} />
        <p className="text-sm">Open a file from the explorer to start coding.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <MonacoEditor file={file} onChange={onChange} readOnly={readOnly} />
    </div>
  );
}