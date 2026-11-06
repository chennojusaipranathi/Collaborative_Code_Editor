import { useState } from "react";
import { FilePlus, Pencil, Trash2, FileCode2 } from "lucide-react";

export default function FileExplorer({ files, activeId, onOpen, onCreate, onRename, onDelete }) {
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const startCreate = () => {
    setRenamingId(null);
    setCreating(true);
    setValue("");
    setError("");
  };

  const startRename = (file) => {
    setCreating(false);
    setRenamingId(file.id);
    setValue(file.name);
    setError("");
  };

  const cancel = () => {
    setCreating(false);
    setRenamingId(null);
    setError("");
  };

  // Enter confirms, Escape cancels
  const handleKeyDown = (e) => {
    if (e.key === "Escape") return cancel();
    if (e.key !== "Enter") return;
    const problem = creating ? onCreate(value) : onRename(renamingId, value);
    if (problem) setError(problem);
    else cancel();
  };

  const inputBox = (
    <div className="px-3 py-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={cancel}
        placeholder="file name, e.g. utils.js"
        className="w-full rounded border border-indigo-400 bg-app px-2 py-1 text-xs text-ink outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-9 items-center justify-between border-b border-line px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Files</span>
        <button onClick={startCreate} aria-label="New file" className="text-muted hover:text-ink">
          <FilePlus size={16} />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto py-1">
        {files.map((file) =>
          renamingId === file.id ? (
            <li key={file.id}>{inputBox}</li>
          ) : (
            <li
              key={file.id}
              className={`group flex items-center justify-between px-3 py-1.5 text-sm ${
                file.id === activeId ? "bg-indigo-500/15 text-indigo-400" : "text-ink hover:bg-app"
              }`}
            >
              <button onClick={() => onOpen(file.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <FileCode2 size={14} className="shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
              <span className="hidden gap-2 text-muted group-hover:flex">
                <button onClick={() => startRename(file)} aria-label={`Rename ${file.name}`} className="hover:text-ink">
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${file.name}?`)) onDelete(file.id);
                  }}
                  aria-label={`Delete ${file.name}`}
                  className="hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </li>
          )
        )}
        {creating && <li>{inputBox}</li>}
      </ul>
    </aside>
  );
}