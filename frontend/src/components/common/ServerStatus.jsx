import { useEffect, useState } from "react";
import { getHealth } from "../../services/api";

export default function ServerStatus() {
  const [online, setOnline] = useState(null); // null = still checking

  useEffect(() => {
    getHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  const color = online === null ? "bg-yellow-400" : online ? "bg-green-400" : "bg-red-400";
  const label = online === null ? "Checking server" : online ? "Server online" : "Server offline";

  return (
    <span className="flex items-center gap-2 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}