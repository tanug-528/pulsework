// Plain-English explanations of each dimension score, written for the
// employee. Scores are 1–5 where 5 = most burned out (see survey-questions.ts).

import { scoreLevel, type ScoreLevel } from "./score-colors.ts";
import type { Dimension } from "./survey-questions.ts";

export const DIMENSION_SUMMARIES: Record<Dimension, string> = {
  exhaustion: "How drained work leaves you, physically and emotionally.",
  cynicism: "How connected and engaged you feel with your work.",
  efficacy: "How capable and accomplished you feel at work (a higher score means feeling less effective).",
  control: "How much say you have over your workload and how you work.",
  recognition: "How seen and valued your contributions feel.",
};

const INTERPRETATIONS: Record<Dimension, Record<ScoreLevel, string>> = {
  exhaustion: {
    healthy: "Your energy looks well protected. Work demands seem to be leaving you enough in the tank for the rest of your life.",
    moderate: "You're feeling some strain. Work is regularly taking a noticeable share of your energy — worth watching before it builds up.",
    high: "You're running on empty. Feeling this drained over time is the core warning sign of burnout, so recovery time really matters right now.",
  },
  cynicism: {
    healthy: "You still feel connected to your work and team and believe what you do matters.",
    moderate: "Some distance is creeping in. You may be caring a bit less or feeling more detached than you used to.",
    high: "You're feeling quite detached from your work. Pulling away emotionally is often a way of coping with sustained pressure.",
  },
  efficacy: {
    healthy: "You feel capable and effective — you're confident in your work and see it as worthwhile.",
    moderate: "Your confidence is mixed. Some days you may feel less effective or unsure your efforts are paying off.",
    high: "You're doubting your impact at the moment. Feeling ineffective is common under strain and doesn't reflect your actual ability.",
  },
  control: {
    healthy: "You have a good degree of autonomy over how you work and what you prioritise.",
    moderate: "Your sense of control is limited in places — workload or priorities may feel set for you more than you'd like.",
    high: "You feel you have little say over your work. A lack of control is one of the strongest drivers of burnout.",
  },
  recognition: {
    healthy: "You feel your contributions are noticed and valued by the people around you.",
    moderate: "Recognition feels inconsistent. Some of your effort may be going unnoticed.",
    high: "You feel largely unseen at work. Going unrecognised over time can wear down motivation and wellbeing.",
  },
};

export function interpretScore(dimension: Dimension, score: number): string {
  return INTERPRETATIONS[dimension][scoreLevel(score)];
}
