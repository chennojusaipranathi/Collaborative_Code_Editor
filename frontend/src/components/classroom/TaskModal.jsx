import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { saveTask } from "../../services/taskService";

// ISO date -> the "YYYY-MM-DDTHH:mm" text a datetime-local input needs, in local time
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TaskModal({ roomId, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    deadline: toLocalInput(task?.deadline),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await saveTask(roomId, {
        title: form.title,
        description: form.description,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? "Edit task" : "Assign a task"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input label="Title" id="title" name="title" value={form.title}
          onChange={handleChange} placeholder="e.g. Reverse a linked list" />

        <div className="mb-4">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink">Instructions</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4}
            className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400" />
        </div>

        <Input label="Deadline (optional)" id="deadline" name="deadline" type="datetime-local"
          value={form.deadline} onChange={handleChange} />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : task ? "Save changes" : "Assign task"}
        </Button>
      </form>
    </Modal>
  );
}