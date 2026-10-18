"use client";

import { useRef, useState, useTransition } from "react";
import { saveBehavioral, saveClinical, submitSurvey } from "@/app/actions/survey";
import {
  BEHAVIORAL_QUESTIONS,
  DIMENSIONS,
  DIMENSION_LABELS,
  questionsForDimension,
  type BehavioralData,
  type BehavioralQuestion,
  type ClinicalQuestion,
} from "@/lib/survey-questions";
import type { SurveyDraft } from "@/lib/surveys";

type Step = { title: string; intro: string; clinical: ClinicalQuestion[]; behavioral: BehavioralQuestion[] };

const STEPS: Step[] = [
  ...DIMENSIONS.map((d) => ({
    title: DIMENSION_LABELS[d],
    intro: "Thinking about the past month, how much do you agree with each statement?",
    clinical: questionsForDimension(d),
    behavioral: [],
  })),
  {
    title: "Your working patterns",
    intro: "A few quick questions about how your weeks actually look.",
    clinical: [],
    behavioral: BEHAVIORAL_QUESTIONS,
  },
];

const TOTAL_QUESTIONS = STEPS.reduce((n, s) => n + s.clinical.length + s.behavioral.length, 0);

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SurveyForm({ draft, firstName }: { draft: SurveyDraft; firstName: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>(() =>
    Object.fromEntries(draft.rawAnswers.map((a) => [a.questionId, a.value])),
  );
  const [behavioral, setBehavioral] = useState<Partial<BehavioralData>>(draft.behavioralData);

  const isStepComplete = (s: Step) =>
    s.clinical.every((q) => answers[q.id] !== undefined) && s.behavioral.every((q) => behavioral[q.id] !== undefined);

  // Resume at the first section that still has unanswered questions.
  const [stepIndex, setStepIndex] = useState(() => {
    const i = STEPS.findIndex((s) => !isStepComplete(s));
    return i === -1 ? STEPS.length - 1 : i;
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>(draft.rawAnswers.length ? "saved" : "idle");
  const inFlight = useRef(0);
  const hadError = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  async function persist(save: () => Promise<boolean>) {
    inFlight.current++;
    setSaveStatus("saving");
    let ok = false;
    try {
      ok = await save();
    } catch {
      ok = false;
    }
    if (!ok) hadError.current = true;
    inFlight.current--;
    if (inFlight.current === 0) {
      setSaveStatus(hadError.current ? "error" : "saved");
      hadError.current = false;
    }
  }

  function answerClinical(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    persist(() => saveClinical(draft.id, questionId, value));
  }

  function answerBehavioral(key: keyof BehavioralData, value: string | number) {
    setBehavioral((prev) => ({ ...prev, [key]: value }));
    persist(() => saveBehavioral(draft.id, key, value));
  }

  function goTo(index: number) {
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isMonthly = draft.surveyType === "monthly";
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const answeredCount = Object.keys(answers).length + Object.keys(behavioral).length;
  const canContinue = isStepComplete(step) && saveStatus !== "saving";

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-teal">
          {isMonthly ? "Monthly reassessment" : "Baseline assessment"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          {isMonthly
            ? `Time for your monthly check, ${firstName}`
            : answeredCount === 0
              ? `Welcome, ${firstName}`
              : `Welcome back, ${firstName}`}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isMonthly && "The same 23 questions as your baseline, so you can see how things have changed. "}
          About 5 minutes. Your answers save automatically, so you can leave and pick up where you left off.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            Section {stepIndex + 1} of {STEPS.length}
          </span>
          <span>
            {answeredCount} of {TOTAL_QUESTIONS} answered
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal transition-all duration-300"
            style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xl font-semibold text-navy">{step.title}</h2>
          <SaveIndicator status={saveStatus} />
        </div>
        <p className="mt-1 text-sm text-slate-500">{step.intro}</p>

        <div className="mt-6 space-y-8">
          {step.clinical.map((q, i) => (
            <LikertQuestion
              key={q.id}
              number={i + 1}
              question={q}
              value={answers[q.id]}
              onChange={(v) => answerClinical(q.id, v)}
            />
          ))}
          {step.behavioral.map((q, i) => (
            <BehavioralField
              key={q.id}
              number={i + 1}
              question={q}
              value={behavioral[q.id]}
              onChange={(v) => answerBehavioral(q.id, v)}
            />
          ))}
        </div>

        {submitError && (
          <p role="alert" className="mt-6 rounded-lg border border-risk/30 bg-risk-light px-3 py-2 text-sm text-risk">
            {submitError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => goTo(stepIndex - 1)}
            disabled={stepIndex === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-navy hover:bg-slate-100 disabled:invisible"
          >
            ← Back
          </button>
          {isLast ? (
            <button
              type="button"
              disabled={!canContinue || submitting}
              onClick={() =>
                startSubmit(async () => {
                  setSubmitError(null);
                  const result = await submitSurvey(draft.id);
                  if (result?.error) setSubmitError(result.error);
                })
              }
              className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Calculating your results…" : "See my results"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => goTo(stepIndex + 1)}
              className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const view = {
    saving: { text: "Saving…", className: "text-slate-500" },
    saved: { text: "✓ All answers saved", className: "text-healthy" },
    error: { text: "Couldn't save — check your connection and try again", className: "text-risk" },
  }[status];
  return (
    <span aria-live="polite" className={`text-xs font-medium ${view.className}`}>
      {view.text}
    </span>
  );
}

const optionClass =
  "flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-medium text-navy transition hover:border-teal peer-checked:border-teal peer-checked:bg-teal peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-teal/40";

export function LikertQuestion({
  number,
  question,
  value,
  onChange,
}: {
  number: number;
  question: ClinicalQuestion;
  value?: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium text-navy">
        <span className="mr-1 text-slate-400">{number}.</span> {question.text}
      </legend>
      <ScaleOptions
        name={question.id}
        value={value}
        onChange={onChange}
        labels={["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"]}
      />
    </fieldset>
  );
}

/** Five 1–5 buttons (real radio inputs) with end labels underneath. */
function ScaleOptions({
  name,
  value,
  onChange,
  labels,
}: {
  name: string;
  value?: number;
  onChange: (value: number) => void;
  labels: string[];
}) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-5 gap-2">
        {labels.map((label, i) => (
          <label key={label} title={label}>
            <input
              type="radio"
              name={name}
              value={i + 1}
              checked={value === i + 1}
              onChange={() => onChange(i + 1)}
              className="peer sr-only"
            />
            <span className={`${optionClass} h-11`}>
              {i + 1}
              <span className="sr-only"> – {label}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-slate-500">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

function BehavioralField({
  number,
  question,
  value,
  onChange,
}: {
  number: number;
  question: BehavioralQuestion;
  value?: string | number;
  onChange: (value: string | number) => void;
}) {
  const legend = (
    <>
      <span className="mr-1 text-slate-400">{number}.</span> {question.text}
    </>
  );

  if (question.input === "dropdown") {
    return (
      <label className="block">
        <span className="font-medium text-navy">{legend}</span>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-navy focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        >
          <option value="" disabled>
            Select hours…
          </option>
          {question.options.map((o) => (
            <option key={o} value={o}>
              {o} hours
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (question.input === "scale") {
    return (
      <fieldset>
        <legend className="font-medium text-navy">{legend}</legend>
        <ScaleOptions
          name={question.id}
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
          labels={question.options}
        />
      </fieldset>
    );
  }

  return (
    <fieldset>
      <legend className="font-medium text-navy">{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {question.options.map((o) => (
          <label key={o}>
            <input
              type="radio"
              name={question.id}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="peer sr-only"
            />
            <span className={`${optionClass} min-h-11 justify-start px-4 py-2.5 text-left`}>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
