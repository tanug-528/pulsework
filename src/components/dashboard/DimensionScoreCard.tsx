import { DIMENSION_SUMMARIES, interpretScore } from "@/lib/dimension-insights";
import { LEVEL_LABELS, SCORE_COLORS, scoreLevel } from "@/lib/score-colors";
import { DIMENSION_LABELS, type Dimension } from "@/lib/survey-questions";

export function DimensionScoreCard({ dimension, score }: { dimension: Dimension; score: number }) {
  const level = scoreLevel(score);
  const color = SCORE_COLORS[level];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy">{DIMENSION_LABELS[dimension]}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{DIMENSION_SUMMARIES[dimension]}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-semibold" style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400"> / 5</span>
        </div>
      </div>

      {/* Score bar, 1–5 */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${((score - 1) / 4) * 100}%`, background: color }} />
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ color, background: `${color}1a` }}>
          {LEVEL_LABELS[level]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">{interpretScore(dimension, score)}</p>
    </div>
  );
}
