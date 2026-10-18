"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNow } from "@/lib/clock";
import type { BehavioralData } from "@/lib/survey-questions";
import { completeDraft, saveBehavioralAnswer, saveClinicalAnswer } from "@/lib/surveys";

// Each action re-checks the session itself: never trust the client to say who it is.
async function employeeId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.accountType === "employee" ? user.id : null;
}

export async function saveClinical(responseId: number, questionId: string, value: number): Promise<boolean> {
  const userId = await employeeId();
  return userId !== null && saveClinicalAnswer(userId, responseId, questionId, value);
}

export async function saveBehavioral(
  responseId: number,
  key: keyof BehavioralData,
  value: string | number,
): Promise<boolean> {
  const userId = await employeeId();
  return userId !== null && saveBehavioralAnswer(userId, responseId, key, value);
}

export async function submitSurvey(responseId: number): Promise<{ error: string }> {
  const userId = await employeeId();
  if (userId === null) redirect("/login");

  const result = completeDraft(userId, responseId, await getNow());
  if (!result.ok) return { error: result.error };
  redirect("/dashboard");
}
