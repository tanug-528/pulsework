import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DevDateTools } from "@/components/DevDateTools";
import { CheckInCard } from "@/components/dashboard/CheckInCard";
import { DimensionScoreCard } from "@/components/dashboard/DimensionScoreCard";
import { calendarMetrics, slackMetrics } from "@/components/dashboard/integration-metrics";
import { GoogleCalendarLogo, IntegrationPanel, SlackLogo } from "@/components/dashboard/IntegrationPanel";
import { ScoreRadar } from "@/components/dashboard/ScoreRadar";
import { SupportBanner } from "@/components/dashboard/SupportBanner";
import { TrendChart, type TrendPoint } from "@/components/dashboard/TrendChart";
import { requireEmployee } from "@/lib/auth";
import { DEV_TOOLS_ENABLED, getFakeToday, getNow } from "@/lib/clock";
import { getSimulatedIntegrations } from "@/lib/integrations";
import { HIGH_THRESHOLD } from "@/lib/score-colors";
import { DIMENSIONS, DIMENSION_LABELS } from "@/lib/survey-questions";
import { getDueCheckIn } from "@/lib/schedule";
import { getCurrentScores, getScoreHistory } from "@/lib/surveys";
import { hasCompletedBaseline } from "@/lib/users";

export const metadata: Metadata = { title: "Your burnout profile" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  const user = await requireEmployee();
  if (!hasCompletedBaseline(user.id)) redirect("/survey");

  const now = await getNow();
  const { scores, lastUpdated } = getCurrentScores(user.id, now);
  const due = getDueCheckIn(user.id, now);
  const trendPoints: TrendPoint[] = getScoreHistory(user.id, now).map((h) => ({
    t: new Date(h.completedAt).getTime(),
    type: h.surveyType,
    ...h.scores,
  }));
  const integrations = getSimulatedIntegrations(user.id);
  const scored = DIMENSIONS.flatMap((d) => (scores[d] === undefined ? [] : [{ dimension: d, score: scores[d]! }]));
  const highDimensions = scored.filter((s) => s.score > HIGH_THRESHOLD).map((s) => DIMENSION_LABELS[s.dimension]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={user.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-sm font-medium uppercase tracking-wider text-teal">Your burnout profile</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Hi {user.name.split(" ")[0]}, here&apos;s how you&apos;re doing</h1>
        <p className="mt-1 text-sm text-slate-500">
          {lastUpdated && <>Last updated {formatDate(lastUpdated)}. </>}
          Scores run 1–5, where higher means more strain. Only you can see this page.
        </p>

        <div className="mt-6">
          <CheckInCard due={due} />
        </div>

        {highDimensions.length > 0 && (
          <div className="mt-6">
            <SupportBanner dimensions={highDimensions} />
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:col-span-2 lg:self-start">
            <h2 className="font-semibold text-navy">Your five dimensions</h2>
            <p className="mt-0.5 text-xs text-slate-500">The larger the shape, the more strain you&apos;re under.</p>
            <ScoreRadar data={scored.map((s) => ({ label: DIMENSION_LABELS[s.dimension], score: s.score }))} />
          </section>

          <section className="space-y-4 lg:col-span-3">
            {scored.map((s) => (
              <DimensionScoreCard key={s.dimension} dimension={s.dimension} score={s.score} />
            ))}
          </section>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">How your scores have changed</h2>
          <p className="mb-4 mt-0.5 text-sm text-slate-500">
            Every monthly survey and weekly pulse check. Weekly pulses update the one area they focus on.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {trendPoints.length > 1 ? (
              <TrendChart
                series={DIMENSIONS.map((d) => ({ key: d, label: DIMENSION_LABELS[d] }))}
                points={trendPoints}
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                Your trend appears here after your first weekly pulse check.
              </p>
            )}
          </div>
        </section>

        {integrations && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-navy">Your work patterns</h2>
            <p className="mb-4 mt-0.5 text-sm text-slate-500">
              Signals from the tools you work in. These are simulated for the demo.
            </p>
            <div className="grid gap-6 lg:grid-cols-2">
              <IntegrationPanel name="Slack" logo={<SlackLogo />} metrics={slackMetrics(integrations.slack)} />
              <IntegrationPanel
                name="Google Calendar"
                logo={<GoogleCalendarLogo />}
                metrics={calendarMetrics(integrations.calendar)}
              />
            </div>
          </section>
        )}
        {DEV_TOOLS_ENABLED && <DevDateTools fakeToday={await getFakeToday()} />}
      </main>
    </div>
  );
}
