"use client";

import { useState, useTransition } from "react";
import { submitPulse } from "@/app/actions/pulse";
import type { ClinicalQuestion } from "@/lib/survey-questions";
import { LikertQuestion } from "./SurveyForm";

export function PulseForm({ questions }: { questions: ClinicalQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const complete = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-8">
      {questions.map((q, i) => (
        <LikertQuestion
          key={q.id}
          number={i + 1}
          question={q}
          value={answers[q.id]}
          onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
        />
      ))}

      {error && (
        <p role="alert" className="rounded-lg border border-risk/30 bg-risk-light px-3 py-2 text-sm text-risk">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <button
          type="button"
          disabled={!complete || submitting}
          onClick={() =>
            startSubmit(async () => {
              setError(null);
              const result = await submitPulse(
                questions.map((q) => ({ questionId: q.id, value: answers[q.id] })),
              );
              if (result?.error) setError(result.error);
            })
          }
          className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Submit check-in"}
        </button>
      </div>
    </div>
  );
}
