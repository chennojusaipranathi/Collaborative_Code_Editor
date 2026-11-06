// Friendly message shown when a list has nothing to display
export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <Icon className="mb-4 text-muted" size={40} />
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mb-5 mt-1 max-w-sm text-sm text-muted">{text}</p>
      {children}
    </div>
  );
}