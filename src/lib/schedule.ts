// Decides which check-in, if any, an employee owes this week.
//
//  - First Monday of the month → the full 23-question monthly reassessment.
//  - Every other Monday        → a 3-question pulse check on the employee's
//                                worst (highest-scoring) dimension.
//
// A check-in opens on Monday and stays available until the following Monday,
// so someone who is off on Monday can still complete it later that week.

import { db } from "./db.ts";
import {
  DIMENSIONS,
  questionsForDimension,
  type ClinicalQuestion,
  type Dimension,
  type DimensionScores,
} from "./survey-questions.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DueCheckIn =
  | { type: "monthly"; opensOn: Date }
  | { type: "pulse"; opensOn: Date; dimension: Dimension; questions: ClinicalQuestion[] }
  | { type: "none"; nextCheckIn: Date; nextType: "monthly" | "pulse" };

/** Midnight on the Monday of the week containing `date`. */
export function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function isFirstMondayOfMonth(monday: Date): boolean {
  return monday.getDate() <= 7;
}

/** The dimension with the highest (most burned-out) score. */
export function worstDimension(scores: Partial<DimensionScores>): Dimension {
  return DIMENSIONS.reduce<Dimension>((worst, d) => ((scores[d] ?? 0) > (scores[worst] ?? 0) ? d : worst), DIMENSIONS[0]);
}

/**
 * Three questions for a pulse on this dimension. Dimensions with four
 * questions rotate which three are asked from week to week.
 */
export function pulseQuestions(dimension: Dimension, monday: Date): ClinicalQuestion[] {
  const all = questionsForDimension(dimension);
  if (all.length <= 3) return all;
  const week = Math.floor(monday.getTime() / (7 * DAY_MS));
  const skip = week % all.length;
  return all.filter((_, i) => i !== skip);
}

/** Scores as of `at`: latest value per dimension (pulses carry the others forward). */
function scoresAsOf(userId: number, at: Date): Partial<DimensionScores> {
  const rows = db
    .prepare(
      `SELECT dimension_scores FROM survey_responses
        WHERE user_id = ? AND status = 'completed' AND completed_at <= ?
        ORDER BY completed_at ASC`,
    )
    .all(userId, at.toISOString()) as { dimension_scores: string }[];
  return rows.reduce<Partial<DimensionScores>>((acc, r) => ({ ...acc, ...JSON.parse(r.dimension_scores) }), {});
}

function completedSince(userId: number, since: Date, types: string[]): boolean {
  const placeholders = types.map(() => "?").join(", ");
  return Boolean(
    db
      .prepare(
        `SELECT 1 FROM survey_responses
          WHERE user_id = ? AND status = 'completed' AND completed_at >= ?
            AND survey_type IN (${placeholders})`,
      )
      .get(userId, since.toISOString(), ...types),
  );
}

export function getDueCheckIn(userId: number, now: Date): DueCheckIn {
  const monday = mondayOf(now);
  const nextMonday = new Date(monday.getTime() + 7 * DAY_MS);
  const nextType = isFirstMondayOfMonth(nextMonday) ? "monthly" : "pulse";

  if (isFirstMondayOfMonth(monday)) {
    // The baseline counts as this month's full survey if it was taken this week.
    if (!completedSince(userId, monday, ["monthly", "baseline"])) return { type: "monthly", opensOn: monday };
  } else if (!completedSince(userId, monday, ["pulse", "monthly", "baseline"])) {
    const dimension = worstDimension(scoresAsOf(userId, now));
    return { type: "pulse", opensOn: monday, dimension, questions: pulseQuestions(dimension, monday) };
  }

  return { type: "none", nextCheckIn: nextMonday, nextType };
}
