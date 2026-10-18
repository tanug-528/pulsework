import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { SupportPortal } from "@/components/support/SupportPortal";
import { requireEmployee } from "@/lib/auth";
import { getNow } from "@/lib/clock";

export const metadata: Metadata = { title: "Mental health benefits" };

// Simulated employer mental health benefits portal (demo only): bookings and
// messages live in the browser and nothing is sent to a real provider.
export default async function SupportPage() {
  const user = await requireEmployee();
  const now = await getNow();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={user.name} />

      <div className="bg-navy">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Private &amp; confidential
            </span>
            <span className="rounded-full border border-dashed border-white/25 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/50">
              Demo
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white">{user.company} Mental Health Benefits</h1>
          <p className="mt-1 text-white/70">Confidential support, covered by your employer.</p>
        </div>
      </div>

      <main className="mx-auto -mt-6 w-full max-w-6xl flex-1 px-4 pb-12">
        <SupportPortal nowIso={now.toISOString()} firstName={user.name.split(" ")[0]} />

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <p>
            <span className="font-semibold text-navy">In crisis or need help right now?</span> If you are in immediate
            danger, call your local emergency number. In the US you can call or text <span className="font-semibold text-navy">988</span>{" "}
            (Suicide &amp; Crisis Lifeline), any time.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your employer pays for this benefit but never sees whether you use it, who you see, or what you discuss.
          <br />
          Demo portal: providers, notes and bookings are simulated, and no messages or emails are sent.
        </p>
      </main>
    </div>
  );
}
