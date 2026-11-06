export default function ParticipantsPanel({ participants }) {
  const onlineCount = participants.filter((p) => p.online).length;

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-l border-line bg-surface lg:flex">
      <div className="flex h-9 items-center justify-between border-b border-line px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">People</span>
        <span className="text-xs text-muted">{onlineCount} online</span>
      </div>

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
    </aside>
  );
}