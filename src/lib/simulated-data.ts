// Generates fake but realistic Slack and Google Calendar numbers for a new
// user. Each signup gets its own random values. Real integrations replace
// this in Phase 2.

export type SlackData = {
  messagesAfter9pmPerWeek: number;
  weekendActiveDaysLastMonth: number; // out of 8 weekend days
  avgResponseTimeMinutes: number;
  messagesPerDay: number;
  generatedAt: string;
};

export type CalendarData = {
  avgMeetingsPerDay: number;
  backToBackBlocksPerWeek: number;
  daysWithoutLunchBreakLastMonth: number; // out of ~20 working days
  focusHoursPerWeek: number;
  generatedAt: string;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

export function generateSlackData(): SlackData {
  return {
    messagesAfter9pmPerWeek: randomInt(0, 35),
    weekendActiveDaysLastMonth: randomInt(0, 8),
    avgResponseTimeMinutes: randomInt(3, 90),
    messagesPerDay: randomInt(15, 140),
    generatedAt: new Date().toISOString(),
  };
}

export function generateCalendarData(): CalendarData {
  return {
    avgMeetingsPerDay: randomDecimal(1.5, 8.5),
    backToBackBlocksPerWeek: randomInt(0, 14),
    daysWithoutLunchBreakLastMonth: randomInt(0, 15),
    focusHoursPerWeek: randomInt(2, 20),
    generatedAt: new Date().toISOString(),
  };
}
