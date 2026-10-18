"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import {
  createUser,
  emailExists,
  findUserForLogin,
  hasCompletedBaseline,
  type AccountType,
} from "@/lib/users";

export type FormState = {
  error?: string;
  /** When someone used the wrong login page, a link to the right one. */
  switchTo?: { href: string; label: string };
  /** Echo back what the user typed (never the password) so the form isn't wiped on error. */
  fields?: Record<string, string>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const fields = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    company: field(formData, "company"),
    role: field(formData, "role"),
  };
  const password = String(formData.get("password") ?? "");

  if (!fields.name || !fields.email || !fields.company || !fields.role || !password) {
    return { error: "Please fill in every field.", fields };
  }
  if (!EMAIL_PATTERN.test(fields.email)) {
    return { error: "Please enter a valid email address.", fields };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, fields };
  }
  if (emailExists(fields.email)) {
    return { error: "An account with this email already exists. Try logging in.", fields };
  }

  const user = createUser({ ...fields, password, accountType: "employee" });
  await createSession(user.id);
  redirect("/survey");
}

async function login(
  formData: FormData,
  expectedType: AccountType,
): Promise<FormState> {
  const fields = { email: field(formData, "email") };
  const password = String(formData.get("password") ?? "");

  const user = findUserForLogin(fields.email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Incorrect email or password.", fields };
  }
  if (user.accountType !== expectedType) {
    return expectedType === "admin"
      ? {
          error: "This is an employee account.",
          switchTo: { href: "/login", label: "Go to the employee login" },
          fields,
        }
      : {
          error: "This is an employer account.",
          switchTo: { href: "/admin/login", label: "Go to the employer login" },
          fields,
        };
  }

  await createSession(user.id);

  if (user.accountType === "admin") redirect("/admin");
  redirect(hasCompletedBaseline(user.id) ? "/dashboard" : "/survey");
}

export async function employeeLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  return login(formData, "employee");
}

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  return login(formData, "admin");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
