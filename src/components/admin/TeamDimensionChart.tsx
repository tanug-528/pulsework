"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SCORE_COLORS, scoreLevel, HIGH_THRESHOLD } from "@/lib/score-colors";

export type DimensionBar = { label: string; score: number };

/** Horizontal bars of this week's team average per dimension, worst first. */
export function TeamDimensionChart({ data }: { data: DimensionBar[] }) {
  const sorted = [...data].sort((a, b) => b.score - a.score);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 24, right: 48, bottom: 8, left: 8 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis type="category" dataKey="label" width={120} tick={{ fill: "#1b2a4a", fontSize: 13 }} />
          <ReferenceLine
            x={HIGH_THRESHOLD}
            stroke={SCORE_COLORS.high}
            strokeDasharray="4 4"
            label={{ value: "High risk", position: "top", fill: SCORE_COLORS.high, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(value) => [Number(value).toFixed(2), "Team average"]}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={26} isAnimationActive={false}>
            {sorted.map((d) => (
              <Cell key={d.label} fill={SCORE_COLORS[scoreLevel(d.score)]} />
            ))}
            <LabelList dataKey="score" position="right" formatter={(v) => Number(v).toFixed(2)} fill="#1b2a4a" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
