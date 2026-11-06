import { Info } from "lucide-react";

// Exam monitoring must be disclosed. This notice is shown to everyone who sees the data.
export default function TelemetryNotice({ children }) {
  return (
    <div className="flex gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300">
      <Info size={18} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}