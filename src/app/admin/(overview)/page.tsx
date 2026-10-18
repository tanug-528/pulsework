import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { TeamDimensionChart } from "@/components/admin/TeamDimensionChart";
import { TeamHeatmap } from "@/components/admin/TeamHeatmap";
import { requireAdmin } from "@/lib/auth";
import { getNow } from "@/lib/clock";
import { LEVEL_LABELS, SCORE_COLORS, scoreLevel } from "@/lib/score-colors";
import {
  DIMENSIONS,
  DIMENSION_DESCRIPTIONS,
  DIMENSION_LABELS,
  DIMENSION_SOURCES_NOTE,
  type Dimension,
} from "@/lib/survey-questions";
import { getTeamStats, MIN_RESPONDENTS } from "@/lib/team-stats";

export const metadata: Metadata = { title: "Team overview" };

// Employer dashboard. Shows team-level aggregates only — never any
// individual employee's data (see src/lib/team-stats.ts).
export default async function AdminPage() {
  const admin = await requireAdmin();
  const stats = getTeamStats(admin.company, await getNow());

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={admin.name} label="Employer" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-sm font-medium uppercase tracking-wider text-teal">{admin.company}</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Team wellbeing overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Anonymous team averages. Scores run 1–5, where higher means more burned out.
        </p>

        {!stats.enoughData ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard label="Employees enrolled" value={stats.enrolled} />
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-navy">Not enough data to display yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                To protect employee anonymity, team results appear once at least {MIN_RESPONDENTS} employees have
                completed the survey.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Employees enrolled" value={stats.enrolled} />
              <StatCard
                label="Survey completion this month"
                value={`${stats.completionRate}%`}
                detail={`${stats.completedThisMonth} of ${stats.enrolled} completed`}
              />
              <StatCard label="Employees with results" value={stats.respondents} detail="Included in averages" />
              <StatCard
                label="Worst dimension"
                value={DIMENSION_LABELS[stats.worstDimension]}
                detail={`Team average ${stats.thisWeek[stats.worstDimension]?.toFixed(2)}`}
                accent={SCORE_COLORS[scoreLevel(stats.thisWeek[stats.worstDimension] ?? 0)]}
              />
            </div>

            <Section title="This week vs last week" subtitle="Team average per dimension, with the change since last week.">
              <p className="-mt-3 mb-4 text-xs text-slate-400">{DIMENSION_SOURCES_NOTE}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {DIMENSIONS.map((d) => (
                  <DimensionDeltaCard key={d} dimension={d} thisWeek={stats.thisWeek[d]} lastWeek={stats.lastWeek[d]} />
                ))}
              </div>
            </Section>

            <div className="mt-10 grid gap-6 lg:grid-cols-5">
              <div className="min-w-0 lg:col-span-2">
                <Section title="Where the team is struggling most" subtitle="This week's team average, worst first.">
                  <Card>
                    <TeamDimensionChart
                      data={DIMENSIONS.flatMap((d) =>
                        stats.thisWeek[d] === undefined ? [] : [{ label: DIMENSION_LABELS[d], score: stats.thisWeek[d]! }],
                      )}
                    />
                  </Card>
                </Section>
              </div>
              <div className="min-w-0 lg:col-span-3">
                <Section title="8-week trend" subtitle="Team average per dimension by week. Red-orange = higher burnout.">
                  <Card>
                    <TeamHeatmap weekly={stats.weekly} />
                  </Card>
                </Section>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      {subtitle && <p className="mb-4 mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      {children}
    </section>
  );
}

function StatCard({ label, value, detail, accent }: { label: string; value: ReactNode; detail?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold" style={{ color: accent ?? "var(--color-navy)" }}>
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function DimensionDeltaCard({
  dimension,
  thisWeek,
  lastWeek,
}: {
  dimension: Dimension;
  thisWeek?: number;
  lastWeek?: number;
}) {
  if (thisWeek === undefined) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-navy">{DIMENSION_LABELS[dimension]}</p>
        <p className="mt-1 text-xs leading-snug text-slate-400">{DIMENSION_DESCRIPTIONS[dimension]}</p>
        <p className="mt-2 text-sm text-slate-500">Not enough data</p>
      </div>
    );
  }

  const level = scoreLevel(thisWeek);
  const delta = lastWeek === undefined ? null : Math.round((thisWeek - lastWeek) * 100) / 100;

  // Higher score = more burnout, so an increase is a decline in wellbeing.
  let deltaView: ReactNode = <span className="text-slate-400">No data last week</span>;
  if (delta !== null) {
    if (Math.abs(delta) < 0.05) {
      deltaView = <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">— No change</span>;
    } else if (delta > 0) {
      deltaView = (
        <span className="rounded-full bg-risk-light px-2 py-0.5 text-risk">▲ {delta.toFixed(2)} worse</span>
      );
    } else {
      deltaView = (
        <span className="rounded-full bg-healthy-light px-2 py-0.5 text-healthy">▼ {Math.abs(delta).toFixed(2)} better</span>
      );
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-navy">{DIMENSION_LABELS[dimension]}</p>
      {/* flex-1 lets descriptions of different lengths keep the scores aligned across the row */}
      <p className="mt-1 flex-1 text-xs leading-snug text-slate-400">{DIMENSION_DESCRIPTIONS[dimension]}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold" style={{ color: SCORE_COLORS[level] }}>
          {thisWeek.toFixed(2)}
        </span>
        <span className="text-xs text-slate-400">/ 5</span>
      </div>
      <p className="mt-0.5 text-xs font-medium" style={{ color: SCORE_COLORS[level] }}>
        {LEVEL_LABELS[level]}
      </p>
      <p className="mt-3 text-xs font-medium">{deltaView}</p>
      {lastWeek !== undefined && <p className="mt-1 text-xs text-slate-400">Last week {lastWeek.toFixed(2)}</p>}
    </div>
  );
}
