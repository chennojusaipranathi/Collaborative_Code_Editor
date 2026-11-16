import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { saveExam } from "../../services/examApi";

export default function ExamSetupModal({ roomId, exam, problem, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: exam?.title ?? "",
    durationMinutes: exam?.durationMinutes ?? 30,
    problem: problem ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await saveExam(roomId, {
        title: form.title,
        durationMinutes: Number(form.durationMinutes),
        problem: form.problem,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={exam ? "Edit exam" : "Set up exam"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input label="Title" id="title" name="title" value={form.title}
          onChange={handleChange} placeholder="e.g. Mid-term lab exam" />

        <Input label="Duration (minutes)" id="durationMinutes" name="durationMinutes" type="number"
          min={1} max={300} value={form.durationMinutes} onChange={handleChange} />

        <div className="mb-4">
          <label htmlFor="problem" className="mb-1 block text-sm font-medium text-ink">
            Problem statement
          </label>
          <textarea id="problem" name="problem" value={form.problem} onChange={handleChange} rows={8}
            placeholder={"1. Print the second largest number.\n2. ..."}
            className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400" />
          <p className="mt-1 text-xs text-muted">
            Students see this only after they start. Changing the duration affects only students who start later.
          </p>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : exam ? "Save changes" : "Save exam"}
        </Button>
      </form>
    </Modal>
  );
}