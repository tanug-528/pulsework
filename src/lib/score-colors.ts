// Shared colour rules for burnout scores (1–5, 5 = most burned out).
// Above 3.5 is "high" (red-orange) — the same threshold that triggers the
// mental health banner on the employee dashboard.

export const HIGH_THRESHOLD = 3.5;
export const HEALTHY_THRESHOLD = 2.5;

export const SCORE_COLORS = {
  healthy: "#2e9e5b",
  moderate: "#d99a1e",
  high: "#e4572e",
} as const;

export type ScoreLevel = keyof typeof SCORE_COLORS;

export function scoreLevel(score: number): ScoreLevel {
  if (score > HIGH_THRESHOLD) return "high";
  if (score < HEALTHY_THRESHOLD) return "healthy";
  return "moderate";
}

export const LEVEL_LABELS: Record<ScoreLevel, string> = {
  healthy: "Healthy",
  moderate: "Watch",
  high: "High risk",
};

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
}

/** Smooth green → amber → red-orange colour for heatmap cells. */
export function heatColor(score: number): string {
  const green = hexToRgb(SCORE_COLORS.healthy);
  const amber = hexToRgb(SCORE_COLORS.moderate);
  const red = hexToRgb(SCORE_COLORS.high);
  const t = Math.min(1, Math.max(0, (score - 1.5) / 2.5)); // 1.5 → 0, 4.0 → 1
  const [r, g, b] = t < 0.5 ? mix(green, amber, t * 2) : mix(amber, red, (t - 0.5) * 2);
  return `rgb(${r}, ${g}, ${b})`;
}
