import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserPlus, LinkIcon } from "lucide-react";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Logo from "../components/common/Logo";
import { previewInvite, acceptInvite } from "../services/inviteService";

const ROLE_TEXT = { viewer: "view only", editor: "view and edit" };

export default function JoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let active = true;
    previewInvite(token)
      .then((data) => active && setInvite(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [token]);

  const join = async () => {
    setJoining(true);
    try {
      const result = await acceptInvite(token);
      navigate(`/room/${result.roomId}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-app px-4">
      <Logo />
      {error ? (
        <EmptyState icon={LinkIcon} title={error} text="Ask the room owner for a new link.">
          <Button to="/dashboard">Go to dashboard</Button>
        </EmptyState>
      ) : !invite ? (
        <p className="text-muted">Checking invite...</p>
      ) : (
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
          <UserPlus className="mx-auto mb-3 text-indigo-400" size={36} />
          <h1 className="text-xl font-bold text-ink">You are invited</h1>

          {invite.myRole && invite.upgrade ? (
            <>
              <p className="mb-6 mt-2 text-sm text-muted">
                You are in <span className="font-medium text-ink">{invite.room.name}</span> as{" "}
                <span className="font-medium text-ink">{invite.myRole}</span>. This link upgrades you to{" "}
                <span className="font-medium text-ink">{invite.role}</span>.
              </p>
              <Button onClick={join} disabled={joining} className="w-full">
                {joining ? "Upgrading..." : "Upgrade my access"}
              </Button>
            </>
          ) : invite.myRole ? (
            <>
              <p className="mb-6 mt-2 text-sm text-muted">
                You are already in <span className="font-medium text-ink">{invite.room.name}</span> as{" "}
                <span className="font-medium text-ink">{invite.myRole}</span>. This link will not lower or
                change your access.
              </p>
              <Button onClick={join} disabled={joining} className="w-full">
                {joining ? "Opening..." : "Open room"}
              </Button>
            </>
          ) : (
            <>
              <p className="mb-6 mt-2 text-sm text-muted">
                Join <span className="font-medium text-ink">{invite.room.name}</span> with permission to{" "}
                <span className="font-medium text-ink">{ROLE_TEXT[invite.role]}</span>.
              </p>
              <Button onClick={join} disabled={joining} className="w-full">
                {joining ? "Joining..." : "Join room"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}