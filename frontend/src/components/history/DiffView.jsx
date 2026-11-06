// Side-by-side comparison. Phase 8 replaces this with Monaco's DiffEditor.
export default function DiffView({ rows, oldTitle, newTitle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="grid grid-cols-2 border-b border-line bg-surface text-xs font-semibold uppercase tracking-wide text-muted">
        <div className="px-3 py-2">{oldTitle}</div>
        <div className="border-l border-line px-3 py-2">{newTitle}</div>
      </div>

      <div className="max-h-112 overflow-auto bg-app font-mono text-xs leading-6">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-2">
            {/* Left column: shows "same" and "removed" lines */}
            <pre
              className={`min-h-6 whitespace-pre-wrap px-3 text-ink ${
                row.type === "removed" ? "bg-red-500/20" : ""
              }`}
            >
              {row.type !== "added" ? row.text : ""}
            </pre>
            {/* Right column: shows "same" and "added" lines */}
            <pre
              className={`min-h-6 whitespace-pre-wrap border-l border-line px-3 text-ink ${
                row.type === "added" ? "bg-green-500/20" : ""
              }`}
            >
              {row.type !== "removed" ? row.text : ""}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}