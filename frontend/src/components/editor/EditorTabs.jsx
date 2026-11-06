import { X } from "lucide-react";

export default function EditorTabs({ openFiles, activeId, onSelect, onClose }) {
  return (
    <div className="flex h-9 shrink-0 overflow-x-auto border-b border-line bg-surface">
      {openFiles.map((file) => (
        <div
          key={file.id}
          className={`flex items-center gap-2 border-r border-line px-3 text-sm ${
            file.id === activeId ? "bg-app text-ink" : "text-muted hover:text-ink"
          }`}
        >
          <button onClick={() => onSelect(file.id)} className="whitespace-nowrap">
            {file.name}
          </button>
          <button onClick={() => onClose(file.id)} aria-label={`Close ${file.name}`} className="hover:text-red-400">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}