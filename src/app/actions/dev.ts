"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEV_TOOLS_ENABLED, FAKE_TODAY_COOKIE, parseDateInput } from "@/lib/clock";

// Development-only "pretend today is…" control for testing weekly and
// monthly check-ins. Does nothing in production.

export async function setFakeToday(formData: FormData): Promise<void> {
  if (!DEV_TOOLS_ENABLED) return;
  const value = String(formData.get("date") ?? "");
  if (!parseDateInput(value)) return;
  (await cookies()).set(FAKE_TODAY_COOKIE, value, { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
}

export async function clearFakeToday(): Promise<void> {
  if (!DEV_TOOLS_ENABLED) return;
  (await cookies()).delete(FAKE_TODAY_COOKIE);
  revalidatePath("/", "layout");
}
