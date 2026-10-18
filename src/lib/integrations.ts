// Reads the simulated Slack / Google Calendar data generated at signup.
// Phase 2 swaps this for real integration data.

import "server-only";
import { db } from "./db";
import type { CalendarData, SlackData } from "./simulated-data";

export function getSimulatedIntegrations(userId: number): { slack: SlackData; calendar: CalendarData } | null {
  const row = db
    .prepare("SELECT slack_data, calendar_data FROM simulated_integrations WHERE user_id = ?")
    .get(userId) as { slack_data: string; calendar_data: string } | undefined;
  return row ? { slack: JSON.parse(row.slack_data), calendar: JSON.parse(row.calendar_data) } : null;
}
