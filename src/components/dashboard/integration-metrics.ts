// Turns the simulated Slack / Calendar data into display metrics, flagging
// values that suggest extra strain.

import type { CalendarData, SlackData } from "@/lib/simulated-data";
import type { Metric } from "./IntegrationPanel";

export function slackMetrics(s: SlackData): Metric[] {
  return [
    {
      label: "Messages sent after 9pm",
      value: String(s.messagesAfter9pmPerWeek),
      detail: "per week",
      flag: s.messagesAfter9pmPerWeek > 10 ? "Frequent late-night work" : undefined,
    },
    {
      label: "Weekend activity",
      value: `${s.weekendActiveDaysLastMonth} of 8`,
      detail: "weekend days active last month",
      flag: s.weekendActiveDaysLastMonth >= 4 ? "Working most weekends" : undefined,
    },
    {
      label: "Average response time",
      value: `${s.avgResponseTimeMinutes} min`,
      flag: s.avgResponseTimeMinutes < 10 ? "Always-on pattern" : undefined,
    },
    {
      label: "Messages sent",
      value: String(s.messagesPerDay),
      detail: "per day",
    },
  ];
}

export function calendarMetrics(c: CalendarData): Metric[] {
  return [
    {
      label: "Meetings per day",
      value: c.avgMeetingsPerDay.toFixed(1),
      detail: "on average",
      flag: c.avgMeetingsPerDay >= 5 ? "Meeting-heavy days" : undefined,
    },
    {
      label: "Back-to-back blocks",
      value: String(c.backToBackBlocksPerWeek),
      detail: "detected per week",
      flag: c.backToBackBlocksPerWeek >= 8 ? "Little recovery time" : undefined,
    },
    {
      label: "Days with no lunch break",
      value: `${c.daysWithoutLunchBreakLastMonth} of 20`,
      detail: "working days last month",
      flag: c.daysWithoutLunchBreakLastMonth >= 8 ? "Skipping breaks often" : undefined,
    },
    {
      label: "Focus time",
      value: `${c.focusHoursPerWeek} h`,
      detail: "uninterrupted per week",
      flag: c.focusHoursPerWeek < 6 ? "Very little focus time" : undefined,
    },
  ];
}
