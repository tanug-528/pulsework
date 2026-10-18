import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PulseForm } from "@/components/survey/PulseForm";
import { requireEmployee } from "@/lib/auth";
import { getNow } from "@/lib/clock";
import { getDueCheckIn } from "@/lib/schedule";
import { DIMENSION_LABELS } from "@/lib/survey-questions";
import { hasCompletedBaseline } from "@/lib/users";

export const metadata: Metadata = { title: "Weekly pulse check" };

// Weekly 3-question pulse check on the employee's worst dimension.
export default async function PulsePage() {
  const user = await requireEmployee();
  if (!hasCompletedBaseline(user.id)) redirect("/survey");

  const due = getDueCheckIn(user.id, await getNow());
  if (due.type === "monthly") redirect("/survey");
  if (due.type !== "pulse") redirect("/dashboard");

  const label = DIMENSION_LABELS[due.dimension];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader name={user.name} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <p className="text-sm font-medium uppercase tracking-wider text-teal">Weekly pulse check</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">3 quick questions on {label.toLowerCase()}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Under 60 seconds. We focus on {label.toLowerCase()} because it&apos;s your highest-scoring area right now,
          so it&apos;s the one most worth keeping an eye on. Think about the past week.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <PulseForm questions={due.questions} />
        </div>
      </main>
    </div>
  );
}
