// Simulated mental health benefits portal content (demo only). Nothing here
// is connected to a real provider: bookings and messages stay in the browser.

export type SessionNote = { daysAgo: number; title: string; body: string };

export type Provider = {
  id: string;
  name: string;
  initials: string;
  title: string;
  specialization: string;
  yearsExperience: number;
  rating: number;
  reviews: number;
  bio: string;
  /** First message in the chat. `{firstName}` is replaced with the employee's name. */
  openingMessage: string;
  notes: SessionNote[];
};

export const PROVIDERS: Provider[] = [
  {
    id: "priya-nair",
    name: "Dr. Priya Nair",
    initials: "PN",
    title: "Licensed Clinical Social Worker",
    specialization: "Workplace stress & burnout",
    yearsExperience: 9,
    rating: 4.9,
    reviews: 214,
    bio: "Helps professionals recover from burnout with practical, compassionate strategies for rest and boundaries.",
    openingMessage:
      "Hi {firstName}, just checking in after our last session. How did the end-of-day shutdown routine go this week? No pressure to write much — even a quick update helps.",
    notes: [
      {
        daysAgo: 13,
        title: "Follow-up: boundaries and workload",
        body: "Client has blocked two focus mornings per week in their calendar and kept to them most of the time. Some guilt about declining meetings remains; we normalised this as part of resetting expectations with colleagues. We discussed raising workload concerns with their manager and drafted talking points together. Plan: continue boundaries work and check in on energy levels next session.",
      },
      {
        daysAgo: 27,
        title: "Follow-up: stress management strategies",
        body: "Client tried the end-of-day shutdown routine on three of five workdays and noticed better sleep on those evenings. We explored a pattern of saying yes to last-minute requests and practised a short script for negotiating deadlines. Introduced box breathing for moments of acute stress before meetings. Client was engaged and reflective throughout.",
      },
      {
        daysAgo: 41,
        title: "Initial consultation",
        body: "Met to discuss growing exhaustion and difficulty switching off after work. Client describes frequent late-evening messaging and feeling 'always on'. We reviewed recent PulseWork results together and identified exhaustion and sense of control as priority areas. Agreed to meet every two weeks and to start a simple end-of-day shutdown routine.",
      },
    ],
  },
  {
    id: "marcus-webb",
    name: "Dr. Marcus Webb",
    initials: "MW",
    title: "Licensed Psychologist",
    specialization: "Anxiety & occupational health",
    yearsExperience: 12,
    rating: 4.8,
    reviews: 187,
    bio: "Uses evidence-based CBT to help people manage work-related anxiety and regain a sense of control.",
    openingMessage:
      "Hi {firstName}, a quick reminder that your worry log is a tool for you, not homework to be graded. Bring whatever you managed to our next session. Take care until then.",
    notes: [
      {
        daysAgo: 20,
        title: "Follow-up: managing work-related anxiety",
        body: "Introduced cognitive reframing for 'what if' thoughts about performance and deadlines. Client kept a worry log for a week and noticed most worries clustered around meetings without clear agendas. We practised a ten-minute 'worry window' to contain racing thoughts in the evening. Client reports feeling 'a bit lighter' and is keen to continue.",
      },
      {
        daysAgo: 34,
        title: "Initial assessment",
        body: "Client describes anticipatory anxiety on Sunday evenings and difficulty falling asleep on most weeknights. We talked through how sustained workload keeps the body's stress response switched on. Agreed goals: reduce Sunday-evening anxiety and build a more consistent sleep routine. Client was open and thoughtful in describing their experience.",
      },
    ],
  },
];

export type Resource = { id: string; title: string; description: string; meta: string };

export const RESOURCES: Resource[] = [
  {
    id: "breathing",
    title: "5-minute breathing exercise",
    description: "A guided box-breathing session to calm your nervous system between meetings.",
    meta: "Audio · 5 min",
  },
  {
    id: "burnout-guide",
    title: "Understanding burnout: a guide",
    description: "What burnout is, the early warning signs, and practical first steps toward recovery.",
    meta: "Article · 8 min read",
  },
  {
    id: "boundaries-workshop",
    title: "Workplace boundaries workshop",
    description: "Learn to protect your time and energy with scripts for common workplace situations.",
    meta: "Video workshop · 45 min",
  },
];

export const SESSIONS_PER_YEAR = 12;
export const SESSIONS_USED = 8;

export const SLOT_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

/** The next five weekdays after `from`, at midnight. */
export function nextWeekdays(from: Date, count = 5): Date[] {
  const days: Date[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
  }
  return days;
}

/**
 * Whether a provider has a slot free. Deterministic (based on provider, date
 * and time) so the calendar looks the same every time it opens.
 */
export function isSlotOpen(providerId: string, day: Date, time: string): boolean {
  const key = `${providerId}|${day.toDateString()}|${time}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % 5 > 1; // roughly 60% of slots open
}
