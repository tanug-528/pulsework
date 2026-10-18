// Guards for server pages. Call one at the top of every protected page so
// employees can't open admin pages and vice versa.

import "server-only";
import { redirect } from "next/navigation";
import { getSessionUserId } from "./session";
import { findUserById, type User } from "./users";

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  return userId ? findUserById(userId) : null;
}

export async function requireEmployee(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountType !== "employee") redirect("/admin");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.accountType !== "admin") redirect("/dashboard");
  return user;
}
