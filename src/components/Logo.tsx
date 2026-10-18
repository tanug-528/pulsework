import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white">
        {/* Pulse line */}
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12h4l3-7 4 14 3-7h6" />
        </svg>
      </span>
      <span className={`text-xl ${light ? "text-white" : "text-navy"}`}>PulseWork</span>
    </Link>
  );
}
