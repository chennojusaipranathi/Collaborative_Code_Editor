import { useState } from "react";
import { Plus, LogIn, Search, FolderOpen } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import RoomCard from "../components/dashboard/RoomCard";
import RoomCardSkeleton from "../components/dashboard/RoomCardSkeleton";
import CreateRoomModal from "../components/dashboard/CreateRoomModal";
import JoinRoomModal from "../components/dashboard/JoinRoomModal";
import useAuth from "../hooks/useAuth";
import useRooms from "../hooks/useRooms";

export default function Dashboard() {
  const { user } = useAuth();
  const { rooms, loading, error, addRoom } = useRooms();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Filter by room name or code (case-insensitive)
  const query = search.trim().toLowerCase();
  const visibleRooms = rooms.filter(
    (r) => r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query)
  );

  const subtitle =
    user.role === "teacher"
      ? "Manage your classrooms and lab exams."
      : "Join a room or start coding with friends.";

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hello, {user.name}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowJoin(true)}>
            <LogIn size={16} /> Join room
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create room
          </Button>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-2.5 text-muted" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms by name or code"
          className="w-full rounded-lg border border-line bg-surface py-2 pl-10 pr-3 text-sm text-ink outline-none focus:border-indigo-400"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => <RoomCardSkeleton key={n} />)}
        </div>
      ) : visibleRooms.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={rooms.length === 0 ? "No rooms yet" : "No rooms match your search"}
          text={rooms.length === 0
            ? "Create your first room or join one with a code."
            : "Try a different name or room code."}
        >
          {rooms.length === 0 && (
            <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create room</Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleRooms.map((room) => <RoomCard key={room.id} room={room} />)}
        </div>
      )}

      {showCreate && (
        <CreateRoomModal role={user.role} onClose={() => setShowCreate(false)} onCreated={addRoom} />
      )}
      {showJoin && (
        <JoinRoomModal onClose={() => setShowJoin(false)} onJoined={addRoom} />
      )}
    </AppShell>
  );
}