import type { ReactNode } from "react";

export type Metric = {
  label: string;
  value: string;
  detail?: string;
  /** Highlights a value that suggests extra strain. */
  flag?: string;
};

/**
 * A simulated integration (Slack / Google Calendar). Shows demo numbers that
 * were randomly generated at signup, clearly labelled as demo data, with a
 * placeholder Connect button for the real Phase 2 integration.
 */
export function IntegrationPanel({
  name,
  logo,
  metrics,
}: {
  name: string;
  logo: ReactNode;
  metrics: Metric[];
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
            {logo}
          </span>
          <div>
            <h3 className="font-semibold text-navy">{name}</h3>
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-healthy">
              <span className="h-1.5 w-1.5 rounded-full bg-healthy" /> Connected
            </span>
          </div>
        </div>
        <span className="rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Demo data
        </span>
      </div>

      <dl className="mt-5 grid flex-1 grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-surface p-3">
            <dt className="text-xs text-slate-500">{m.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-navy">{m.value}</dd>
            {m.detail && <dd className="text-xs text-slate-500">{m.detail}</dd>}
            {m.flag && (
              <dd className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-risk">
                <span className="h-1.5 w-1.5 rounded-full bg-risk" /> {m.flag}
              </dd>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">Simulated for the demo. Live sync is coming soon.</p>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="cursor-not-allowed rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500"
        >
          Connect {name}
        </button>
      </div>
    </div>
  );
}

/** Simplified Slack mark. */
export function SlackLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-label="Slack" role="img">
      <rect x="8.6" y="1.5" width="3.4" height="8.6" rx="1.7" fill="#36C5F0" />
      <rect x="13.9" y="8.6" width="8.6" height="3.4" rx="1.7" fill="#2EB67D" />
      <rect x="12" y="13.9" width="3.4" height="8.6" rx="1.7" fill="#ECB22E" />
      <rect x="1.5" y="12" width="8.6" height="3.4" rx="1.7" fill="#E01E5A" />
      <circle cx="3.2" cy="8.8" r="1.7" fill="#36C5F0" />
      <circle cx="15.2" cy="3.2" r="1.7" fill="#2EB67D" />
      <circle cx="20.8" cy="15.2" r="1.7" fill="#ECB22E" />
      <circle cx="8.8" cy="20.8" r="1.7" fill="#E01E5A" />
    </svg>
  );
}

/** Simplified Google Calendar mark. */
export function GoogleCalendarLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-label="Google Calendar" role="img">
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#fff" stroke="#4285F4" strokeWidth="1.6" />
      <path d="M3 7.5V5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v2Z" fill="#4285F4" />
      <path d="M17 21h1.5a2.5 2.5 0 0 0 2.5-2.5V17Z" fill="#EA4335" />
      <text x="12" y="17.6" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1A73E8" fontFamily="Arial, sans-serif">
        31
      </text>
    </svg>
  );
}
