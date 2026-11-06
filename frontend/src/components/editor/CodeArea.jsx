import { useRef } from "react";
import { FileX } from "lucide-react";

// TEMPORARY: a plain textarea. In Phase 4 this becomes the Monaco Editor.
export default function CodeArea({ file, onChange }) {
  const gutterRef = useRef(null);

  if (!file) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted">
        <FileX size={36} />
        <p className="text-sm">Open a file from the explorer to start coding.</p>
      </div>
    );
  }

  const lineCount = file.content.split("\n").length;
  const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  // Keep the line numbers scrolled together with the text
  const syncScroll = (e) => {
    gutterRef.current.scrollTop = e.target.scrollTop;
  };

  return (
    <div className="flex min-h-0 flex-1 bg-app font-mono text-sm leading-6">
      <div
        ref={gutterRef}
        className="w-12 shrink-0 select-none overflow-hidden whitespace-pre border-r border-line py-3 pr-2 text-right text-muted"
      >
        {numbers}
      </div>
      <textarea
        key={file.id}
        value={file.content}
        onChange={(e) => onChange(file.id, e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        wrap="off"
        className="flex-1 resize-none bg-transparent p-3 text-ink outline-none"
      />
    </div>
  );
}