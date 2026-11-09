import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { colorFor } from "../../utils/userColor";

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatPanel({ messages, meId, onSend, onTyping, typing = {}, disabled }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  // Who is typing right now (calculated on every render, not inside an effect)
  const names = Object.values(typing);
  const typingLabel =
    names.length === 0
      ? ""
      : names.length === 1
        ? `${names[0]} is typing...`
        : names.length === 2
          ? `${names[0]} and ${names[1]} are typing...`
          : "Several people are typing...";

  // Scroll to the newest message (and when the typing label appears)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingLabel]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const problem = await onSend(text);
    if (problem) return setError(problem);
    setError("");
    setText("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-xs text-muted">No messages yet. Say hello!</p>}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2">
            <span
              style={{ backgroundColor: colorFor(m.senderId) }}
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase text-white"
            >
              {m.senderName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-xs">
                <span className="font-medium text-ink">
                  {m.senderId === meId ? "You" : m.senderName}
                </span>{" "}
                <span className="text-muted">{time(m.createdAt)}</span>
              </p>
              {/* React escapes text, so message content can never run as HTML */}
              <p className="whitespace-pre-wrap break-words text-sm text-ink">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-line p-2">
        {/* Fixed height so the layout doesn't jump when the label appears */}
        <p className="h-4 text-xs italic text-muted">{typingLabel}</p>
        {error && <p className="mb-1 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping?.();
            }}
            maxLength={1000}
            disabled={disabled}
            placeholder={disabled ? "Offline..." : "Message the room"}
            className="min-w-0 flex-1 rounded-lg border border-line bg-app px-3 py-1.5 text-sm text-ink outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            aria-label="Send message"
            className="rounded-lg bg-indigo-500 p-2 text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}