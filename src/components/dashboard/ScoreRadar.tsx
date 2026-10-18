"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export type RadarPoint = { label: string; score: number };

/** Five-dimension burnout profile. A bigger shape means more strain. */
export function ScoreRadar({ data }: { data: RadarPoint[] }) {
  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%" margin={{ top: 8, right: 44, bottom: 8, left: 44 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "#1b2a4a", fontSize: 12 }} />
          <PolarRadiusAxis domain={[1, 5]} tickCount={5} angle={90} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="#0f6e56"
            strokeWidth={2}
            fill="#0f6e56"
            fillOpacity={0.25}
            dot={{ r: 3, fill: "#0f6e56" }}
            isAnimationActive={false}
          />
          <Tooltip formatter={(value) => [Number(value).toFixed(1), "Score"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
