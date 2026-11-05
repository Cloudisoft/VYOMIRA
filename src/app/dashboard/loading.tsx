export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-surface/60" />
      <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface/50" />)}</div>
      <div className="grid gap-6 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-surface/50" /><div className="h-80 animate-pulse rounded-3xl bg-surface/50" /></div>
    </div>
  );
}
