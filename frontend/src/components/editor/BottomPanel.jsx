import { useState } from "react";
import { Trash2 } from "lucide-react";

const TABS = ["Output", "Input", "Problems"];

export default function BottomPanel({ output, stdin, onStdinChange, onClearOutput, problems }) {
  const [tab, setTab] = useState("Output");

  return (
    <section className="flex h-56 shrink-0 flex-col border-t border-line bg-surface">
      <div className="flex h-9 items-center justify-between border-b border-line px-2">
        <div className="flex">
          {TABS.map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`px-3 py-2 text-xs font-medium uppercase tracking-wide ${
                tab === name ? "text-indigo-400" : "text-muted hover:text-ink"
              }`}
            >
              {name}
              {name === "Problems" && problems.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-amber-400">
                  {problems.length}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === "Output" && (
          <button onClick={onClearOutput} aria-label="Clear output" className="px-2 text-muted hover:text-ink">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
        {tab === "Output" &&
          (output.length === 0 ? (
            <p className="text-muted">Click Run to see the output here.</p>
          ) : (
            output.map((line, i) => (
              <p key={i} className="whitespace-pre-wrap text-ink">{line}</p>
            ))
          ))}

        {tab === "Input" && (
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Type the program input (stdin) here..."
            className="h-full w-full resize-none bg-transparent text-ink outline-none"
          />
        )}

                 {tab === "Problems" &&
          (problems.length === 0 ? (
            <p className="text-muted">No problems detected.</p>
          ) : (
            problems.map((p, i) => (
              <p key={i} className={p.severity === "error" ? "text-red-400" : "text-amber-400"}>
                [{p.severity}] Line {p.line}, col {p.column}: {p.message}
              </p>
            ))
          ))}
      </div>
    </section>
  );
}