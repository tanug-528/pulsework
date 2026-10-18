import Link from "next/link";

// Shown when any dimension scores above 3.5. Supportive, not alarming.
// Links to the (simulated) employer mental health benefits portal.
export function SupportBanner({ dimensions }: { dimensions: string[] }) {
  return (
    <div role="note" className="flex flex-col gap-4 rounded-2xl border border-teal/20 bg-teal-light p-5 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </span>
      <div className="flex-1">
        <p className="font-semibold text-navy">Your employer offers confidential mental health support</p>
        <p className="mt-0.5 text-sm text-slate-600">
          Your {dimensions.join(" and ").toLowerCase()} {dimensions.length > 1 ? "scores are" : "score is"} in the high range.
          You don&apos;t have to handle that alone — support is free and private.
        </p>
      </div>
      <Link
        href="/support"
        className="shrink-0 rounded-lg bg-teal px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-dark"
      >
        Explore support options
      </Link>
    </div>
  );
}
