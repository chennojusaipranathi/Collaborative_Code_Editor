// A labelled text input with an optional error message under it
export default function Input({ label, id, error, ...props }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border bg-app px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-indigo-400 ${
          error ? "border-red-400" : "border-line"
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}