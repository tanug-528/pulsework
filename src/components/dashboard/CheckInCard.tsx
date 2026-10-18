import Link from "next/link";
import type { DueCheckIn } from "@/lib/schedule";
import { DIMENSION_LABELS } from "@/lib/survey-questions";

function weekday(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** Prompts the employee to do this week's check-in, or says when the next one is. */
export function CheckInCard({ due }: { due: DueCheckIn }) {
  if (due.type === "none") {
    return (
      <p className="text-sm text-slate-500">
        <span className="font-medium text-healthy">✓ You&apos;re all caught up.</span> Next check-in:{" "}
        {due.nextType === "monthly" ? "monthly reassessment" : "weekly pulse"} on {weekday(due.nextCheckIn)}.
      </p>
    );
  }

  const isPulse = due.type === "pulse";
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-navy p-5 text-white sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-teal-light/80">
          {isPulse ? "Weekly pulse check" : "Monthly reassessment"} · ready now
        </p>
        <p className="mt-1 font-semibold">
          {isPulse
            ? `3 quick questions on ${DIMENSION_LABELS[due.dimension].toLowerCase()}, under 60 seconds`
            : "Retake the full 23-question survey to see how this month compares"}
        </p>
      </div>
      <Link
        href={isPulse ? "/pulse" : "/survey"}
        className="shrink-0 rounded-lg bg-teal px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-dark"
      >
        {isPulse ? "Start pulse check" : "Start reassessment"}
      </Link>
    </div>
  );
}
