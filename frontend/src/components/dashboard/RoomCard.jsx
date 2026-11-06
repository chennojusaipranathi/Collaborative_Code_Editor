import { Link } from "react-router-dom";
import { Users, Clock, Code2 } from "lucide-react";
import { ROOM_MODES } from "../../utils/roomModes";
import { timeAgo } from "../../utils/timeAgo";

export default function RoomCard({ room }) {
  const mode = ROOM_MODES[room.mode];

  return (
    <Link
      to={`/room/${room.id}`}
      className="block rounded-xl border border-line bg-surface p-5 transition-colors hover:border-indigo-400"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${mode.color}`}>
          {mode.label}
        </span>
        <span className="text-xs capitalize text-muted">{room.myRole}</span>
      </div>

      <h3 className="mb-1 font-semibold text-ink">{room.name}</h3>
      <p className="mb-4 text-xs text-muted">
        Code: <span className="font-mono">{room.code}</span>
      </p>

      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1"><Code2 size={14} />{room.language}</span>
        <span className="flex items-center gap-1"><Users size={14} />{room.participants}</span>
        <span className="flex items-center gap-1"><Clock size={14} />{timeAgo(room.lastEdited)}</span>
      </div>
    </Link>
  );
}