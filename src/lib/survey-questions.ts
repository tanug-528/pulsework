// The PulseWork assessment: 18 clinical questions across five burnout
// dimensions plus 5 behavioral baseline questions. Wording is original to
// PulseWork (not copied from any licensed instrument).
//
// Scoring convention used everywhere in the app: every dimension score runs
// 1–5 where 5 = MOST burned out. Positively worded questions (efficacy,
// control, recognition) are reverse-scored to fit that convention.

export const DIMENSIONS = ["exhaustion", "cynicism", "efficacy", "control", "recognition"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export type DimensionScores = Record<Dimension, number>;

export const DIMENSION_LABELS: Record<Dimension, string> = {
  exhaustion: "Exhaustion",
  cynicism: "Cynicism",
  efficacy: "Efficacy",
  control: "Sense of control",
  recognition: "Recognition",
};

/** One-line clinical context shown under each dimension name. */
export const DIMENSION_DESCRIPTIONS: Record<Dimension, string> = {
  exhaustion: "Maslach dimension 1 of 3 — physical and emotional depletion from sustained work demands",
  cynicism: "Maslach dimension 2 of 3 — detachment and loss of enthusiasm toward work",
  efficacy: "Maslach dimension 3 of 3 — employee sense of accomplishment and competence at work",
  control: "Burnout Assessment Tool — degree of autonomy and influence over how work gets done",
  recognition: "Burnout Assessment Tool — whether employees feel their contributions are seen and valued",
};

export const DIMENSION_SOURCES_NOTE =
  "Dimensions sourced from the Maslach Burnout Inventory and the Burnout Assessment Tool.";

export type ClinicalQuestion = {
  id: string;
  dimension: Dimension;
  text: string;
  /** True for positively worded items: agreement means LESS burnout. */
  reverse: boolean;
};

export const CLINICAL_QUESTIONS: ClinicalQuestion[] = [
  { id: "ex1", dimension: "exhaustion", reverse: false, text: "I feel emotionally drained by the end of my workday." },
  { id: "ex2", dimension: "exhaustion", reverse: false, text: "I wake up tired at the thought of another day of work." },
  { id: "ex3", dimension: "exhaustion", reverse: false, text: "My work leaves me with little energy for the rest of my life." },
  { id: "ex4", dimension: "exhaustion", reverse: false, text: "I feel physically worn out because of my job." },

  { id: "cy1", dimension: "cynicism", reverse: false, text: "I've become less interested in my work than I used to be." },
  { id: "cy2", dimension: "cynicism", reverse: false, text: "I doubt that my work makes a real difference." },
  { id: "cy3", dimension: "cynicism", reverse: false, text: "I feel detached from my team and what we're trying to achieve." },
  { id: "cy4", dimension: "cynicism", reverse: false, text: "I just want to get through the day without caring how it goes." },

  { id: "ef1", dimension: "efficacy", reverse: true, text: "I can effectively solve the problems that come up in my work." },
  { id: "ef2", dimension: "efficacy", reverse: true, text: "I feel I'm making a valuable contribution at work." },
  { id: "ef3", dimension: "efficacy", reverse: true, text: "I'm confident that I do my job well." },
  { id: "ef4", dimension: "efficacy", reverse: true, text: "I accomplish things at work that feel worthwhile." },

  { id: "co1", dimension: "control", reverse: true, text: "I have a say in how I do my work." },
  { id: "co2", dimension: "control", reverse: true, text: "My workload is manageable within my normal hours." },
  { id: "co3", dimension: "control", reverse: true, text: "I can set my own priorities on most days." },

  { id: "re1", dimension: "recognition", reverse: true, text: "My contributions are noticed by the people I work with." },
  { id: "re2", dimension: "recognition", reverse: true, text: "I receive appropriate credit when I do good work." },
  { id: "re3", dimension: "recognition", reverse: true, text: "My manager acknowledges the effort I put in." },
];

export const AGREEMENT_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

export type BehavioralQuestion = {
  id: keyof BehavioralData;
  text: string;
  input: "dropdown" | "choice" | "scale";
  options: string[];
};

export type BehavioralData = {
  dailyHours: string;
  afterHoursFrequency: string;
  backToBackMeetings: string;
  sleepQuality: number; // 1 (very poor) – 5 (very good)
  lastFullDayOff: string;
};

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: "dailyHours",
    text: "How many hours do you typically work per day?",
    input: "dropdown",
    options: ["Less than 6", "6–8", "8–9", "9–10", "10–12", "More than 12"],
  },
  {
    id: "afterHoursFrequency",
    text: "How often do you work outside your normal hours?",
    input: "choice",
    options: ["Never", "Rarely (about once a month)", "Sometimes (weekly)", "Often (several times a week)", "Almost every day"],
  },
  {
    id: "backToBackMeetings",
    text: "On average, how many back-to-back meetings do you have per day?",
    input: "choice",
    options: ["0", "1–2", "3–4", "5–6", "7 or more"],
  },
  {
    id: "sleepQuality",
    text: "How would you rate your sleep quality this past week?",
    input: "scale",
    options: ["Very poor", "Poor", "Fair", "Good", "Very good"],
  },
  {
    id: "lastFullDayOff",
    text: "When did you last take a full day off with no work at all?",
    input: "choice",
    options: ["This week", "Within the last month", "1–3 months ago", "3–6 months ago", "More than 6 months ago"],
  },
];

export type RawAnswer = { questionId: string; value: number };

const QUESTIONS_BY_ID = new Map(CLINICAL_QUESTIONS.map((q) => [q.id, q]));

export function questionsForDimension(dimension: Dimension): ClinicalQuestion[] {
  return CLINICAL_QUESTIONS.filter((q) => q.dimension === dimension);
}

/**
 * Averages answers per dimension (reverse-scoring where needed), rounded to
 * 2 decimals. Only dimensions that have at least one answer are included, so
 * a 3-question pulse check returns a single dimension.
 */
export function scoreDimensions(answers: RawAnswer[]): Partial<DimensionScores> {
  const totals = new Map<Dimension, { sum: number; count: number }>();

  for (const { questionId, value } of answers) {
    const question = QUESTIONS_BY_ID.get(questionId);
    if (!question) continue;
    const burnoutValue = question.reverse ? 6 - value : value;
    const t = totals.get(question.dimension) ?? { sum: 0, count: 0 };
    totals.set(question.dimension, { sum: t.sum + burnoutValue, count: t.count + 1 });
  }

  const scores: Partial<DimensionScores> = {};
  for (const [dimension, { sum, count }] of totals) {
    scores[dimension] = Math.round((sum / count) * 100) / 100;
  }
  return scores;
}
