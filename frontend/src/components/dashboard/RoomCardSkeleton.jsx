// Grey placeholder shaped like a RoomCard, shown while rooms load
export default function RoomCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 h-5 w-24 rounded-full bg-line" />
      <div className="mb-2 h-4 w-3/4 rounded bg-line" />
      <div className="mb-5 h-3 w-1/3 rounded bg-line" />
      <div className="h-3 w-2/3 rounded bg-line" />
    </div>
  );
}