// Data access for survey responses.

import { db } from "./db.ts";
import {
  BEHAVIORAL_QUESTIONS,
  CLINICAL_QUESTIONS,
  scoreDimensions,
  type BehavioralData,
  type DimensionScores,
  type RawAnswer,
} from "./survey-questions.ts";

export type SurveyType = "baseline" | "monthly" | "pulse";

/** A full survey (baseline or monthly) that the employee hasn't submitted yet. */
export type SurveyDraft = {
  id: number;
  surveyType: SurveyType;
  rawAnswers: RawAnswer[];
  behavioralData: Partial<BehavioralData>;
};

type DraftRow = {
  id: number;
  survey_type: SurveyType;
  raw_answers: string;
  behavioral_data: string | null;
};

function toDraft(row: DraftRow): SurveyDraft {
  return {
    id: row.id,
    surveyType: row.survey_type,
    rawAnswers: JSON.parse(row.raw_answers),
    behavioralData: row.behavioral_data ? JSON.parse(row.behavioral_data) : {},
  };
}

// Every query below filters by user_id as well as the response id, so one
// employee can never read or change another employee's survey.

function findDraft(userId: number, responseId: number): DraftRow | undefined {
  return db
    .prepare(
      `SELECT id, survey_type, raw_answers, behavioral_data FROM survey_responses
        WHERE id = ? AND user_id = ? AND status = 'in_progress'`,
    )
    .get(responseId, userId) as DraftRow | undefined;
}

/**
 * Returns the employee's unfinished survey of this type, creating one if
 * needed. A draft started before `notBefore` is stale (e.g. last month's
 * unfinished reassessment) and is replaced with a fresh one.
 */
export function getOrCreateDraft(userId: number, surveyType: SurveyType, now: Date, notBefore?: Date): SurveyDraft {
  const existing = db
    .prepare(
      `SELECT id, survey_type, raw_answers, behavioral_data, started_at FROM survey_responses
        WHERE user_id = ? AND survey_type = ? AND status = 'in_progress'
        ORDER BY id DESC LIMIT 1`,
    )
    .get(userId, surveyType) as (DraftRow & { started_at: string }) | undefined;

  if (existing && (!notBefore || new Date(existing.started_at) >= notBefore)) return toDraft(existing);
  if (existing) db.prepare("DELETE FROM survey_responses WHERE id = ? AND user_id = ?").run(existing.id, userId);

  const result = db
    .prepare("INSERT INTO survey_responses (user_id, survey_type, status, started_at) VALUES (?, ?, 'in_progress', ?)")
    .run(userId, surveyType, now.toISOString());
  return toDraft(findDraft(userId, Number(result.lastInsertRowid))!);
}

const CLINICAL_IDS = new Set(CLINICAL_QUESTIONS.map((q) => q.id));

/** Saves (or changes) one 1–5 answer. Returns false if the input or survey is invalid. */
export function saveClinicalAnswer(userId: number, responseId: number, questionId: string, value: number): boolean {
  if (!CLINICAL_IDS.has(questionId) || !Number.isInteger(value) || value < 1 || value > 5) return false;
  const row = findDraft(userId, responseId);
  if (!row) return false;

  const answers: RawAnswer[] = JSON.parse(row.raw_answers).filter((a: RawAnswer) => a.questionId !== questionId);
  answers.push({ questionId, value });
  db.prepare("UPDATE survey_responses SET raw_answers = ? WHERE id = ?").run(JSON.stringify(answers), row.id);
  return true;
}

/** Saves (or changes) one behavioral answer. Returns false if the input or survey is invalid. */
export function saveBehavioralAnswer(
  userId: number,
  responseId: number,
  key: keyof BehavioralData,
  value: string | number,
): boolean {
  const question = BEHAVIORAL_QUESTIONS.find((q) => q.id === key);
  if (!question) return false;
  const valid =
    question.input === "scale"
      ? Number.isInteger(value) && Number(value) >= 1 && Number(value) <= question.options.length
      : typeof value === "string" && question.options.includes(value);
  if (!valid) return false;

  const row = findDraft(userId, responseId);
  if (!row) return false;

  const data = { ...(row.behavioral_data ? JSON.parse(row.behavioral_data) : {}), [key]: value };
  db.prepare("UPDATE survey_responses SET behavioral_data = ? WHERE id = ?").run(JSON.stringify(data), row.id);
  return true;
}

/**
 * Marks a draft as completed and stores its dimension scores. Every one of
 * the 23 questions must be answered first.
 */
export function completeDraft(
  userId: number,
  responseId: number,
  completedAt: Date,
): { ok: true } | { ok: false; error: string } {
  const row = findDraft(userId, responseId);
  if (!row) return { ok: false, error: "This survey has already been submitted or doesn't exist." };

  const draft = toDraft(row);
  const answered = new Set(draft.rawAnswers.map((a) => a.questionId));
  const missingClinical = CLINICAL_QUESTIONS.filter((q) => !answered.has(q.id)).length;
  const missingBehavioral = BEHAVIORAL_QUESTIONS.filter((q) => draft.behavioralData[q.id] === undefined).length;
  if (missingClinical + missingBehavioral > 0) {
    return { ok: false, error: `Please answer all questions (${missingClinical + missingBehavioral} left).` };
  }

  db.prepare(
    `UPDATE survey_responses
        SET status = 'completed', dimension_scores = ?, completed_at = ?
      WHERE id = ? AND user_id = ?`,
  ).run(JSON.stringify(scoreDimensions(draft.rawAnswers)), completedAt.toISOString(), row.id, userId);
  return { ok: true };
}

/** Stores a finished survey, computing dimension scores from the raw answers. */
export function insertCompletedSurvey(input: {
  userId: number;
  surveyType: SurveyType;
  rawAnswers: RawAnswer[];
  behavioralData: BehavioralData | null;
  completedAt: Date;
}): void {
  const completedAt = input.completedAt.toISOString();
  db.prepare(
    `INSERT INTO survey_responses
       (user_id, survey_type, status, dimension_scores, raw_answers, behavioral_data, started_at, completed_at)
     VALUES (?, ?, 'completed', ?, ?, ?, ?, ?)`,
  ).run(
    input.userId,
    input.surveyType,
    JSON.stringify(scoreDimensions(input.rawAnswers)),
    JSON.stringify(input.rawAnswers),
    input.behavioralData ? JSON.stringify(input.behavioralData) : null,
    completedAt,
    completedAt,
  );
}

export type CurrentScores = {
  scores: Partial<DimensionScores>;
  lastUpdated: string | null;
  baselineCompletedAt: string | null;
};

type HistoryRow = { survey_type: SurveyType; dimension_scores: string; completed_at: string };

function completedResponses(userId: number, asOf: Date): HistoryRow[] {
  return db
    .prepare(
      `SELECT survey_type, dimension_scores, completed_at FROM survey_responses
        WHERE user_id = ? AND status = 'completed' AND completed_at <= ?
        ORDER BY completed_at ASC`,
    )
    .all(userId, asOf.toISOString()) as HistoryRow[];
}

/**
 * The employee's current score per dimension: their most recent value for
 * each one. Pulse checks only update one dimension, so the rest carry forward
 * from earlier surveys.
 */
export function getCurrentScores(userId: number, asOf: Date): CurrentScores {
  const rows = completedResponses(userId, asOf);

  let scores: Partial<DimensionScores> = {};
  for (const row of rows) scores = { ...scores, ...JSON.parse(row.dimension_scores) };

  return {
    scores,
    lastUpdated: rows.at(-1)?.completed_at ?? null,
    baselineCompletedAt: rows.find((r) => r.survey_type === "baseline")?.completed_at ?? null,
  };
}

export type ScoreHistoryPoint = {
  completedAt: string;
  surveyType: SurveyType;
  /** Only the dimensions this survey actually measured (one for a pulse, all five otherwise). */
  scores: Partial<DimensionScores>;
};

/** Every completed survey and pulse check, oldest first, for the trend chart. */
export function getScoreHistory(userId: number, asOf: Date): ScoreHistoryPoint[] {
  return completedResponses(userId, asOf).map((r) => ({
    completedAt: r.completed_at,
    surveyType: r.survey_type,
    scores: JSON.parse(r.dimension_scores),
  }));
}
