import { useEffect, useRef, useState } from "react";
import { Bug, FileText, Send, Sparkles } from "lucide-react";
import { askAssistant } from "../../services/aiService";

const ACTIONS = [
  { key: "explain", label: "Explain", icon: FileText },
  { key: "bugs", label: "Find bugs", icon: Bug },
  { key: "improve", label: "Improve", icon: Sparkles },
];

const TITLE = { explain: "Explain code", bugs: "Find bugs", improve: "Suggest improvements" };

export default function AiPanel({ roomId, context, disabled }) {
  const [items, setItems] = useState([]); // [{ id, title, answer, provider, error }]
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const bottomRef = useRef(null);

  const hasCode = Boolean(context.fileName && context.code?.trim());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, busy]);

  const run = async (action, text = "") => {
    setBusy(true);
    const title = action === "ask" ? `Q: ${text}` : `${TITLE[action]} (${context.fileName})`;
    try {
      const res = await askAssistant(roomId, {
        action,
        fileName: context.fileName,
        code: context.code,
        question: text,
      });
      setItems((list) => [...list.slice(-19), { id: crypto.randomUUID(), title, ...res }]);
    } catch (err) {
      setItems((list) => [...list.slice(-19), { id: crypto.randomUUID(), title, error: err.message }]);
    } finally {
      setBusy(false);
    }
  };

  const submitQuestion = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    run("ask", question.trim());
    setQuestion("");
  };

  const off = disabled || busy || !hasCode;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {items.length === 0 && (
          <p className="text-xs text-muted">
            {hasCode
              ? `Pick an action to get help with ${context.fileName}. The open file is sent to the assistant.`
              : "Open a file with some code to use the assistant."}
          </p>
        )}

        {items.map((it) => (
          <div key={it.id} className="rounded-lg border border-line bg-app p-2">
            <p className="mb-1 text-xs font-semibold text-ink">{it.title}</p>
            {it.error ? (
              <p className="text-xs text-red-400">{it.error}</p>
            ) : (
              <>
                {it.provider === "mock" && (
                  <p className="mb-1 inline-block rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    Mock mode
                  </p>
                )}
                {/* React escapes this text, so an answer can never run as HTML */}
                <p className="whitespace-pre-wrap break-words text-xs text-ink">{it.answer}</p>
              </>
            )}
          </div>
        ))}

        {busy && <p className="text-xs italic text-muted">Thinking...</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line p-2">
        <div className="mb-2 flex gap-1">
          {ACTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => run(key)}
              disabled={off}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line px-1 py-1.5 text-[11px] text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={submitQuestion} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            disabled={off}
            placeholder="Ask about this code"
            className="min-w-0 flex-1 rounded-lg border border-line bg-app px-3 py-1.5 text-sm text-ink outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={off || !question.trim()}
            aria-label="Ask"
            className="rounded-lg bg-indigo-500 p-2 text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}