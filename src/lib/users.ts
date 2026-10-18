// Data access for users and their simulated integrations.

import { db } from "./db.ts";
import { hashPassword } from "./password.ts";
import { generateCalendarData, generateSlackData } from "./simulated-data.ts";

export type AccountType = "employee" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  accountType: AccountType;
  createdAt: string;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  company: string;
  role: string;
  account_type: AccountType;
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    role: row.role,
    accountType: row.account_type,
    createdAt: row.created_at,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserById(id: number): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

/** Returns the user plus their password hash, for login checks only. */
export function findUserForLogin(email: string): (User & { passwordHash: string }) | null {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizeEmail(email)) as UserRow | undefined;
  return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
}

export function emailExists(email: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalizeEmail(email)));
}

type NewUser = {
  name: string;
  email: string;
  password: string;
  company: string;
  role: string;
  accountType: AccountType;
};

/**
 * Creates a user. Employees also get their randomly generated Slack and
 * Calendar demo data, in the same transaction.
 */
export function createUser(input: NewUser): User {
  db.exec("BEGIN");
  try {
    const result = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, company, role, account_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.name.trim(),
        normalizeEmail(input.email),
        hashPassword(input.password),
        input.company.trim(),
        input.role.trim(),
        input.accountType,
      );
    const userId = Number(result.lastInsertRowid);

    if (input.accountType === "employee") {
      db.prepare(
        "INSERT INTO simulated_integrations (user_id, slack_data, calendar_data) VALUES (?, ?, ?)",
      ).run(userId, JSON.stringify(generateSlackData()), JSON.stringify(generateCalendarData()));
    }

    db.exec("COMMIT");
    return findUserById(userId)!;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function hasCompletedBaseline(userId: number): boolean {
  return Boolean(
    db
      .prepare(
        "SELECT 1 FROM survey_responses WHERE user_id = ? AND survey_type = 'baseline' AND status = 'completed'",
      )
      .get(userId),
  );
}
