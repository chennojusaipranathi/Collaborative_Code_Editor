import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";

export default function CreateSnapshotModal({ onClose, onCreate }) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("Give the snapshot a label");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onCreate(label.trim());
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="Save a snapshot" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input
          label="Label"
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={error}
          placeholder="e.g. Before refactoring"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save snapshot"}
        </Button>
      </form>
    </Modal>
  );
}