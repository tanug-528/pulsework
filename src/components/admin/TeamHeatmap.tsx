import { heatColor } from "@/lib/score-colors";
import { DIMENSIONS, DIMENSION_LABELS } from "@/lib/survey-questions";
import type { WeeklyAverage } from "@/lib/team-stats";

/** Dimensions × weeks grid of team averages. Darker red-orange = more burned out. */
export function TeamHeatmap({ weekly }: { weekly: WeeklyAverage[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="w-36" />
            {weekly.map((w) => (
              <th key={w.label} className="px-1 pb-1 text-center text-xs font-medium text-slate-500">
                {w.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIMENSIONS.map((d) => (
            <tr key={d}>
              <th scope="row" className="pr-2 text-left font-medium text-navy">
                {DIMENSION_LABELS[d]}
              </th>
              {weekly.map((w) => {
                const score = w.scores[d];
                return (
                  <td
                    key={w.label}
                    className="h-10 rounded-md text-center text-xs font-semibold text-white"
                    style={{ background: score === undefined ? "#e2e8f0" : heatColor(score) }}
                    title={score === undefined ? "Not enough data" : `${DIMENSION_LABELS[d]}: ${score.toFixed(2)}`}
                  >
                    {score === undefined ? "–" : score.toFixed(1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
