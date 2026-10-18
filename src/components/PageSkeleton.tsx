// Placeholder shown while a dashboard loads. Mirrors the real layout so the
// page doesn't jump when content arrives.
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-live="polite">
      <div className="h-[60px] bg-navy" />
      <main className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-4 py-10">
        <span className="sr-only">{label}</span>
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="mt-3 h-7 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-3 h-3 w-96 max-w-full rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
          ))}
        </div>
        <div className="mt-6 h-80 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
      </main>
    </div>
  );
}
