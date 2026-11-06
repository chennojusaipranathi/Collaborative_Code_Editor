import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Button from "../components/common/Button";

export default function RoomPlaceholder() {
  const { roomId } = useParams(); // reads :roomId from the URL

  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-bold text-ink">Room {roomId}</h1>
      <p className="mb-4 text-muted">The collaborative editor is built in Phase 4.</p>
      <Button to="/dashboard" variant="secondary">Back to dashboard</Button>
    </AppShell>
  );
}