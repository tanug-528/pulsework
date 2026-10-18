// Aggregate, team-level burnout statistics for the employer dashboard.
//
// PRIVACY RULE: nothing exported from this file may return data about an
// individual employee. Every number is an average or count across the team,
// and nothing is returned at all until MIN_RESPONDENTS employees have
// completed a survey.

import "server-only";
import { db } from "./db";
import { DIMENSIONS, type Dimension, type DimensionScores } from "./survey-questions";

export const MIN_RESPONDENTS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_WEEKS = 8;

export type WeeklyAverage = { label: string; scores: Partial<DimensionScores> };

export type TeamStats =
  | { enoughData: false; enrolled: number }
  | {
      enoughData: true;
      enrolled: number;
      respondents: number;
      completedThisMonth: number;
      completionRate: number; // 0–100
      thisWeek: Partial<DimensionScores>;
      lastWeek: Partial<DimensionScores>;
      weekly: WeeklyAverage[]; // oldest first
      worstDimension: Dimension;
    };

type ResponseRow = {
  user_id: number;
  survey_type: string;
  dimension_scores: string;
  completed_at: string;
};

type Reading = { userId: number; type: string; at: number; scores: Partial<DimensionScores> };

/**
 * Team average per dimension as of a point in time. Each employee counts once,
 * using their most recent score for that dimension (pulse checks only update
 * one dimension, so the others carry forward from earlier surveys). A
 * dimension is left out if fewer than MIN_RESPONDENTS employees have a score.
 */
function teamAverageAt(readings: Reading[], at: number): Partial<DimensionScores> {
  const latest = new Map<number, Partial<DimensionScores>>();
  for (const r of readings) {
    if (r.at > at) break; // readings are sorted oldest first
    latest.set(r.userId, { ...latest.get(r.userId), ...r.scores });
  }

  const averages: Partial<DimensionScores> = {};
  for (const d of DIMENSIONS) {
    const values = [...latest.values()].map((s) => s[d]).filter((v): v is number => v !== undefined);
    if (values.length >= MIN_RESPONDENTS) {
      averages[d] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    }
  }
  return averages;
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getTeamStats(company: string, now = new Date()): TeamStats {
  const enrolled = (
    db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE account_type = 'employee' AND lower(company) = lower(?)")
      .get(company.trim()) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT r.user_id, r.survey_type, r.dimension_scores, r.completed_at
         FROM survey_responses r
         JOIN users u ON u.id = r.user_id
        WHERE u.account_type = 'employee'
          AND lower(u.company) = lower(?)
          AND r.status = 'completed'
        ORDER BY r.completed_at ASC`,
    )
    .all(company.trim()) as ResponseRow[];

  const readings: Reading[] = rows.map((r) => ({
    userId: r.user_id,
    type: r.survey_type,
    at: new Date(r.completed_at).getTime(),
    scores: JSON.parse(r.dimension_scores),
  }));

  const respondents = new Set(readings.map((r) => r.userId)).size;
  if (respondents < MIN_RESPONDENTS) return { enoughData: false, enrolled };

  // Completion this month: employees who finished a full survey (baseline or
  // monthly reassessment) since the 1st of the current month.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const completedThisMonth = new Set(
    readings.filter((r) => r.type !== "pulse" && r.at >= monthStart).map((r) => r.userId),
  ).size;

  const nowMs = now.getTime();
  const weekly: WeeklyAverage[] = [];
  for (let i = HEATMAP_WEEKS - 1; i >= 0; i--) {
    const at = nowMs - i * 7 * DAY_MS;
    weekly.push({ label: i === 0 ? "This week" : weekLabel(new Date(at)), scores: teamAverageAt(readings, at) });
  }

  const thisWeek = weekly[weekly.length - 1].scores;
  const lastWeek = weekly[weekly.length - 2].scores;
  const worstDimension = DIMENSIONS.reduce<Dimension>(
    (worst, d) => ((thisWeek[d] ?? 0) > (thisWeek[worst] ?? 0) ? d : worst),
    DIMENSIONS[0],
  );

  return {
    enoughData: true,
    enrolled,
    respondents,
    completedThisMonth,
    completionRate: enrolled ? Math.round((completedThisMonth / enrolled) * 100) : 0,
    thisWeek,
    lastWeek,
    weekly,
    worstDimension,
  };
}
