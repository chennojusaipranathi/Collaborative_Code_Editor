import { useEffect, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { createInvite, listInvites, revokeInvite } from "../../services/inviteService";

const ROLE_LABEL = { viewer: "Can view", editor: "Can edit" };
const selectClass =
  "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400";

export default function ShareModal({ roomId, onClose }) {
  const [role, setRole] = useState("viewer"); // safest default
  const [hours, setHours] = useState(24);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let active = true;
    listInvites(roomId)
      .then((list) => active && setInvites(list))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [roomId]);

  const generate = async () => {
    setError("");
    setBusy(true);
    try {
      const invite = await createInvite(roomId, { role, expiresInHours: hours });
      setInvites((list) => [invite, ...list]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (invite) => {
    try {
      await navigator.clipboard.writeText(invite.link);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard blocked: the link is visible, so it can be copied by hand
    }
  };

  const revoke = async (id) => {
    try {
      await revokeInvite(roomId, id);
      setInvites((list) => list.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title="Share this room" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="inv-role" className="mb-1 block text-sm font-medium text-ink">Guests can</label>
          <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
            <option value="viewer">View only</option>
            <option value="editor">View and edit</option>
          </select>
        </div>
        <div>
          <label htmlFor="inv-exp" className="mb-1 block text-sm font-medium text-ink">Link expires in</label>
          <select id="inv-exp" value={hours} onChange={(e) => setHours(Number(e.target.value))} className={selectClass}>
            <option value={1}>1 hour</option>
            <option value={24}>1 day</option>
            <option value={168}>7 days</option>
          </select>
        </div>
      </div>

      <Button onClick={generate} disabled={busy} className="mb-4 w-full">
        {busy ? "Creating..." : "Create invite link"}
      </Button>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Active links</p>
      {invites.length === 0 ? (
        <p className="text-sm text-muted">No active links yet.</p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {invites.map((i) => (
            <li key={i.id} className="rounded-lg border border-line p-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{ROLE_LABEL[i.role]}</span>
                <span className="text-muted">
                  expires {new Date(i.expiresAt).toLocaleString()} · used {i.uses}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={i.link}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 rounded border border-line bg-app px-2 py-1 text-xs text-ink"
                />
                <button onClick={() => copy(i)} aria-label="Copy link" className="text-muted hover:text-ink">
                  {copiedId === i.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button onClick={() => revoke(i.id)} aria-label="Revoke link" className="text-muted hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}