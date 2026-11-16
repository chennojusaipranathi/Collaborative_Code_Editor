import { useState } from "react";
import ChatPanel from "./ChatPanel";
import AiPanel from "./AiPanel";

export default function ParticipantsPanel({ participants, chat, meId, disabled, onTabChange, roomId, aiContext }) {
  const [tab, setTab] = useState("people");
  const onlineCount = participants.filter((p) => p.online).length;

  const openTab = (name) => {
    setTab(name);
    onTabChange?.(name);
    if (name === "chat") chat.clearUnread();
  };

  const tabClass = (name) =>
    `flex-1 px-2 py-2 text-xs font-semibold uppercase tracking-wide ${
      tab === name ? "text-indigo-400" : "text-muted hover:text-ink"
    }`;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-line bg-surface lg:flex">
      <div className="flex h-9 border-b border-line">
        <button onClick={() => openTab("people")} className={tabClass("people")}>
          People ({onlineCount})
        </button>
        <button onClick={() => openTab("chat")} className={tabClass("chat")}>
          Chat
          {chat.unread > 0 && (
            <span className="ml-1 rounded-full bg-indigo-500 px-1.5 text-[10px] text-white">{chat.unread}</span>
          )}
        </button>
        <button onClick={() => openTab("ai")} className={tabClass("ai")}>
          AI
        </button>
      </div>

      {tab === "people" && (
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-semibold uppercase text-white">
                {p.name.charAt(0)}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
                    p.online ? "bg-green-400" : "bg-slate-500"
                  }`}
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{p.name}</p>
                <p className="text-xs capitalize text-muted">{p.role}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "chat" && (
        <ChatPanel
          messages={chat.messages}
          meId={meId}
          onSend={chat.send}
          onTyping={chat.notifyTyping}
          typing={chat.typing}
          disabled={disabled}
        />
      )}

      {tab === "ai" && <AiPanel roomId={roomId} context={aiContext} disabled={disabled} />}
    </aside>
  );
}