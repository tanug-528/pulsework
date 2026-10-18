// Database layer: a single SQLite file at data/pulsework.db, using Node's
// built-in `node:sqlite` module. Tables are created automatically the first
// time the app (or the seed script) opens the database.
//
// This file only imports Node built-ins and relative `.ts` files so that the
// seed script in scripts/ can import it directly with plain `node`.

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "pulsework.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL,
    email               TEXT    NOT NULL UNIQUE,
    password_hash       TEXT    NOT NULL,
    company             TEXT    NOT NULL,
    role                TEXT    NOT NULL,             -- job role, e.g. "Product Designer"
    account_type        TEXT    NOT NULL CHECK (account_type IN ('employee', 'admin')),
    integration_signals TEXT,                         -- JSON; Phase 2 automated Slack/Calendar signals
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS survey_responses (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_type      TEXT    NOT NULL CHECK (survey_type IN ('baseline', 'monthly', 'pulse')),
    status           TEXT    NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    dimension_scores TEXT,                            -- JSON: { exhaustion, cynicism, efficacy, control, recognition }
    raw_answers      TEXT    NOT NULL DEFAULT '[]',   -- JSON array of { questionId, value }
    behavioral_data  TEXT,                            -- JSON object of behavioral baseline answers
    started_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    completed_at     TEXT                             -- null while the survey is in progress
  );

  CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);

  CREATE TABLE IF NOT EXISTS simulated_integrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    slack_data    TEXT    NOT NULL,                   -- JSON, generated on signup
    calendar_data TEXT    NOT NULL                    -- JSON, generated on signup
  );
`;

function open(): DatabaseSync {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  return db;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { pulseworkDb?: DatabaseSync };

export const db: DatabaseSync = globalForDb.pulseworkDb ?? open();
globalForDb.pulseworkDb = db;
