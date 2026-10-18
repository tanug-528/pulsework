"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendSeries = { key: string; label: string };
export type TrendPoint = { t: number; type: string } & Record<string, number | string | undefined>;

// Categorical palette (validated for colour-vision deficiency; see the
// dataviz palette check). Fixed order, so each dimension keeps its colour.
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

const TYPE_LABELS: Record<string, string> = { baseline: "Baseline", monthly: "Monthly", pulse: "Weekly pulse" };

function shortDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * One line per dimension. A weekly pulse only measures one dimension, so each
 * line only has points where that dimension was actually measured; lines are
 * drawn straight across the gaps.
 */
export function TrendChart({ series, points }: { series: TrendSeries[]; points: TrendPoint[] }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 64, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#eef1f5" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={shortDate}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickMargin={8}
              minTickGap={24}
              padding={{ left: 16, right: 16 }}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              width={44}
              tick={{ fill: "#64748b", fontSize: 12 }}
              label={{ value: "Score", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 12, dx: 6 }}
            />
            <ReferenceLine
              y={3.5}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: "High (3.5)", position: "right", fill: "#64748b", fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(t, payload) => {
                const type = payload?.[0]?.payload?.type as string | undefined;
                return `${shortDate(Number(t))}${type ? ` · ${TYPE_LABELS[type]}` : ""}`;
              }}
              formatter={(value, name) => [Number(value).toFixed(1), name]}
            />
            <Legend
              verticalAlign="top"
              iconType="plainline"
              itemSorter={(item) => series.findIndex((s) => s.key === item.dataKey)}
              wrapperStyle={{ fontSize: 12, color: "#1b2a4a", paddingBottom: 8 }}
            />
            {series.map((s, i) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stroke={SERIES_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: SERIES_COLORS[i] }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="mt-2 text-xs font-medium text-teal hover:underline"
        aria-expanded={showTable}
      >
        {showTable ? "Hide table" : "View as table"}
      </button>

      {showTable && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Check-in</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 pr-3 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.t} className="border-b border-slate-100 text-navy">
                  <td className="py-2 pr-3">{shortDate(p.t)}</td>
                  <td className="py-2 pr-3 text-slate-500">{TYPE_LABELS[p.type]}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-2 pr-3 tabular-nums">
                      {typeof p[s.key] === "number" ? (p[s.key] as number).toFixed(1) : "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
