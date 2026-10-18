"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNow } from "@/lib/clock";
import { getDueCheckIn } from "@/lib/schedule";
import type { RawAnswer } from "@/lib/survey-questions";
import { insertCompletedSurvey } from "@/lib/surveys";

export async function submitPulse(answers: RawAnswer[]): Promise<{ error: string }> {
  const user = await getCurrentUser();
  if (!user || user.accountType !== "employee") redirect("/login");

  // Re-check on the server that a pulse is actually due, and that the answers
  // are exactly this week's three questions with valid 1–5 values.
  const now = await getNow();
  const due = getDueCheckIn(user.id, now);
  if (due.type !== "pulse") return { error: "There's no pulse check due right now." };

  const expected = due.questions.map((q) => q.id).sort().join(",");
  const received = answers.map((a) => a.questionId).sort().join(",");
  const valid = answers.every((a) => Number.isInteger(a.value) && a.value >= 1 && a.value <= 5);
  if (expected !== received || !valid) return { error: "Please answer all three questions." };

  insertCompletedSurvey({
    userId: user.id,
    surveyType: "pulse",
    rawAnswers: answers.map(({ questionId, value }) => ({ questionId, value })),
    behavioralData: null,
    completedAt: now,
  });
  redirect("/dashboard");
}
