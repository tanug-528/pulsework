import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { requireEmployee } from "@/lib/auth";
import { getNow } from "@/lib/clock";
import { getDueCheckIn } from "@/lib/schedule";
import { getOrCreateDraft, type SurveyDraft } from "@/lib/surveys";
import { hasCompletedBaseline } from "@/lib/users";

export const metadata: Metadata = { title: "Assessment" };

// The full 23-question survey: the baseline at signup, then the monthly
// reassessment on the first Monday of each month.
export default async function SurveyPage() {
  const user = await requireEmployee();
  const now = await getNow();

  let draft: SurveyDraft;
  if (!hasCompletedBaseline(user.id)) {
    draft = getOrCreateDraft(user.id, "baseline", now);
  } else {
    const due = getDueCheckIn(user.id, now);
    if (due.type === "pulse") redirect("/pulse");
    if (due.type !== "monthly") redirect("/dashboard");
    // An unfinished reassessment from an earlier month is replaced with a fresh one.
    draft = getOrCreateDraft(user.id, "monthly", now, due.opensOn);
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={user.name} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <SurveyForm draft={draft} firstName={user.name.split(" ")[0]} />
      </main>
    </div>
  );
}
