import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { joinRoom } from "../../services/roomService";

export default function JoinRoomModal({ onClose, onJoined }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const room = await joinRoom(code);
      onJoined(room);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="Join a room" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input label="Room code" id="code" value={code} maxLength={6}
          onChange={(e) => setCode(e.target.value)} placeholder="6-character code" />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Joining..." : "Join room"}
        </Button>
      </form>
    </Modal>
  );
}