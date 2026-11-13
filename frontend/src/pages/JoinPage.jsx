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

  const name = invite?.room.name;

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

          <p className="mb-6 mt-2 text-sm text-muted">
            {invite.myRole === "owner" ? (
              <>You own <b className="text-ink">{name}</b>. Links never change the owner's access.</>
            ) : invite.changes ? (
              <>
                Your access to <b className="text-ink">{name}</b> will change from{" "}
                <b className="text-ink">{invite.myRole}</b> to{" "}
                <b className="text-ink">{invite.role}</b> ({ROLE_TEXT[invite.role]}).
              </>
            ) : invite.myRole ? (
              <>You already have this access (<b className="text-ink">{invite.myRole}</b>) in <b className="text-ink">{name}</b>.</>
            ) : (
              <>
                Join <b className="text-ink">{name}</b> with permission to{" "}
                <b className="text-ink">{ROLE_TEXT[invite.role]}</b>.
              </>
            )}
          </p>

          <Button onClick={join} disabled={joining} className="w-full">
            {joining
              ? "Please wait..."
              : invite.changes
                ? `Change my access to ${invite.role}`
                : invite.myRole
                  ? "Open room"
                  : "Join room"}
          </Button>
        </div>
      )}
    </div>
  );
}