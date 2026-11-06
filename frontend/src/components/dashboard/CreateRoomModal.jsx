import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { ROOM_MODES, LANGUAGES } from "../../utils/roomModes";
import { createRoom } from "../../services/roomService";

const selectClass =
  "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400";

export default function CreateRoomModal({ role, onClose, onCreated }) {
  // Students can only make Free Coding rooms. Teachers can make all modes.
  const allowedModes = role === "teacher" ? Object.keys(ROOM_MODES) : ["free"];

  const [form, setForm] = useState({ name: "", mode: "free", language: "JavaScript" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const room = await createRoom(form);
      onCreated(room);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="Create a room" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input label="Room name" id="name" name="name" value={form.name}
          onChange={handleChange} placeholder="e.g. DSA Practice" />

        <div className="mb-4">
          <label htmlFor="mode" className="mb-1 block text-sm font-medium text-ink">Mode</label>
          <select id="mode" name="mode" value={form.mode} onChange={handleChange} className={selectClass}>
            {allowedModes.map((key) => (
              <option key={key} value={key}>{ROOM_MODES[key].label}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="language" className="mb-1 block text-sm font-medium text-ink">Language</label>
          <select id="language" name="language" value={form.language} onChange={handleChange} className={selectClass}>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create room"}
        </Button>
      </form>
    </Modal>
  );
}