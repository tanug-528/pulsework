// Seeds demo data. Safe to run more than once: existing accounts are skipped.
//   npm run seed
//
// 1. The employer admin account. Admins can't sign up through the website;
//    this script is how they are created. Employees are linked to an admin by
//    company name (case-insensitive).
// 2. Demo employees at Acme Corp with ~10 weeks of survey history (baseline,
//    monthly reassessments on first Mondays, weekly pulse checks), so the
//    employer dashboard has enough data to clear the 5-person anonymity gate.

import { db } from "../src/lib/db.ts";
import { createUser, emailExists } from "../src/lib/users.ts";
import { insertCompletedSurvey } from "../src/lib/surveys.ts";
import {
  BEHAVIORAL_QUESTIONS,
  CLINICAL_QUESTIONS,
  DIMENSIONS,
  questionsForDimension,
  scoreDimensions,
  type BehavioralData,
  type Dimension,
  type DimensionScores,
  type RawAnswer,
} from "../src/lib/survey-questions.ts";

const COMPANY = process.env.ADMIN_COMPANY ?? "Acme Corp";

const DEMO_ADMIN = {
  name: "Acme HR Admin",
  email: process.env.ADMIN_EMAIL ?? "admin@acme.test",
  password: process.env.ADMIN_PASSWORD ?? "pulsework-admin",
  company: COMPANY,
  role: "HR Lead",
};

// All demo employees share the same password as the Phase 1 test employee (local test data only).
const DEMO_EMPLOYEE_PASSWORD = "testpass123";

const DEMO_EMPLOYEES = [
  ["Alex Morgan", "Software Engineer"],
  ["Priya Shah", "Product Manager"],
  ["Daniel Okafor", "Data Analyst"],
  ["Sofia Rossi", "UX Designer"],
  ["Liam Chen", "Customer Success Manager"],
  ["Emma Novak", "Marketing Specialist"],
  ["Mateo Garcia", "Sales Executive"],
  ["Hannah Lee", "QA Engineer"],
  ["Omar Haddad", "DevOps Engineer"],
  ["Grace Kim", "HR Generalist"],
  ["Noah Williams", "Finance Analyst"],
  ["Aisha Bello", "Engineering Manager"],
] as const;

const WEEKS_OF_HISTORY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

// Team-wide drift per week in burnout points (positive = getting worse), so
// the dashboard shows a believable trend: workload is creeping up while
// recognition is improving.
const WEEKLY_DRIFT: DimensionScores = {
  exhaustion: 0.06,
  cynicism: 0.015,
  efficacy: 0,
  control: 0.03,
  recognition: -0.035,
};

// Typical starting level per dimension (1–5, 5 = most burned out).
const BASELINE_MEAN: DimensionScores = {
  exhaustion: 3.1,
  cynicism: 2.6,
  efficacy: 2.2,
  control: 2.9,
  recognition: 3.1,
};

// ---------- small random helpers ----------

function gaussian(mean = 0, sd = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// ---------- dates ----------

function mostRecentMonday(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function isFirstMondayOfMonth(monday: Date): boolean {
  return monday.getDate() <= 7;
}

/** A random working-hours time on the given day, never in the future. */
function timeOnDay(day: Date, now: Date): Date {
  const d = new Date(day);
  d.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0);
  return d > now ? new Date(now.getTime() - 5 * 60 * 1000) : d;
}

// ---------- answer generation ----------

/** Turns a target burnout level into a realistic 1–5 answer for one question. */
function answerFor(questionId: string, reverse: boolean, level: number): RawAnswer {
  const burnoutAnswer = clamp(Math.round(level + gaussian(0, 0.45)), 1, 5);
  return { questionId, value: reverse ? 6 - burnoutAnswer : burnoutAnswer };
}

function behavioralFor(exhaustion: number): BehavioralData {
  const option = (questionId: keyof BehavioralData, index: number) => {
    const options = BEHAVIORAL_QUESTIONS.find((q) => q.id === questionId)!.options;
    return options[clamp(Math.round(index), 0, options.length - 1)];
  };
  // More exhausted people tend to work longer, sleep worse and take fewer days off.
  const strain = exhaustion - 1; // 0–4
  return {
    dailyHours: option("dailyHours", 1 + strain * 0.7 + gaussian(0, 0.7)),
    afterHoursFrequency: option("afterHoursFrequency", strain * 0.9 + gaussian(0, 0.7)),
    backToBackMeetings: option("backToBackMeetings", 0.5 + strain * 0.7 + gaussian(0, 0.8)),
    sleepQuality: clamp(Math.round(5 - strain * 0.8 + gaussian(0, 0.7)), 1, 5),
    lastFullDayOff: option("lastFullDayOff", 0.5 + strain * 0.7 + gaussian(0, 0.8)),
  };
}

// ---------- seeding ----------

function seedAdmin(): void {
  if (emailExists(DEMO_ADMIN.email)) {
    console.log(`Admin ${DEMO_ADMIN.email} already exists.`);
    return;
  }
  createUser({ ...DEMO_ADMIN, accountType: "admin" });
  console.log(`Created admin ${DEMO_ADMIN.email} for company "${COMPANY}".`);
}

function seedEmployee(name: string, role: string, now: Date, firstMonday: Date): boolean {
  const email = `${name.toLowerCase().replace(" ", ".")}@acme.test`;
  if (emailExists(email)) return false;

  const user = createUser({
    name,
    email,
    password: DEMO_EMPLOYEE_PASSWORD,
    company: COMPANY,
    role,
    accountType: "employee",
  });

  // Each person has their own starting profile around the team average.
  const base = {} as DimensionScores;
  for (const d of DIMENSIONS) base[d] = clamp(gaussian(BASELINE_MEAN[d], 0.55), 1.3, 4.6);

  const levelAt = (date: Date): DimensionScores => {
    const weeks = (date.getTime() - firstMonday.getTime()) / (7 * DAY_MS);
    const level = {} as DimensionScores;
    for (const d of DIMENSIONS) level[d] = clamp(base[d] + WEEKLY_DRIFT[d] * weeks + gaussian(0, 0.15), 1, 5);
    return level;
  };

  const fullSurvey = (type: "baseline" | "monthly", at: Date) => {
    const level = levelAt(at);
    const answers = CLINICAL_QUESTIONS.map((q) => answerFor(q.id, q.reverse, level[q.dimension]));
    insertCompletedSurvey({
      userId: user.id,
      surveyType: type,
      rawAnswers: answers,
      behavioralData: behavioralFor(level.exhaustion),
      completedAt: at,
    });
    return scoreDimensions(answers) as DimensionScores;
  };

  // Joined during the first week of the history window.
  const joinedAt = timeOnDay(new Date(firstMonday.getTime() + Math.floor(Math.random() * 4) * DAY_MS), now);
  db.prepare("UPDATE users SET created_at = ? WHERE id = ?").run(joinedAt.toISOString(), user.id);

  const latest = fullSurvey("baseline", joinedAt);

  for (let monday = new Date(firstMonday.getTime() + 7 * DAY_MS); monday <= now; monday = new Date(monday.getTime() + 7 * DAY_MS)) {
    const at = timeOnDay(monday, now);
    const isCurrentMonth = monday.getMonth() === now.getMonth() && monday.getFullYear() === now.getFullYear();

    if (isFirstMondayOfMonth(monday)) {
      // Most people complete the monthly reassessment; a few skip this month's.
      if (Math.random() < (isCurrentMonth ? 0.8 : 0.95)) Object.assign(latest, fullSurvey("monthly", at));
    } else if (Math.random() < 0.9) {
      // Weekly pulse: 3 questions from the dimension currently scoring worst.
      const worst = DIMENSIONS.reduce<Dimension>((a, b) => (latest[b] > latest[a] ? b : a), "exhaustion");
      const questions = [...questionsForDimension(worst)].sort(() => Math.random() - 0.5).slice(0, 3);
      const level = levelAt(at)[worst];
      const answers = questions.map((q) => answerFor(q.id, q.reverse, level));
      insertCompletedSurvey({ userId: user.id, surveyType: "pulse", rawAnswers: answers, behavioralData: null, completedAt: at });
      Object.assign(latest, scoreDimensions(answers));
    }
  }
  return true;
}

const now = new Date();
const firstMonday = new Date(mostRecentMonday(now).getTime() - WEEKS_OF_HISTORY * 7 * DAY_MS);

seedAdmin();

let created = 0;
for (const [name, role] of DEMO_EMPLOYEES) {
  if (seedEmployee(name, role, now, firstMonday)) created++;
}
console.log(
  created > 0
    ? `Created ${created} demo employees at ${COMPANY} with survey history since ${firstMonday.toDateString()}.`
    : "Demo employees already exist.",
);
