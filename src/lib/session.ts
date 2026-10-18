// Session cookie: "<base64url payload>.<HMAC signature>". The payload holds
// only the user id and an expiry. The signature (keyed by SESSION_SECRET)
// means a user can't edit the cookie to impersonate someone else.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pulsework_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = { userId: number; expiresAt: number };

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short. Add it to .env.local (see README).");
  }
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export async function createSession(userId: number): Promise<void> {
  const payload: SessionPayload = { userId, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");

  (await cookies()).set(COOKIE_NAME, `${data}.${sign(data)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionUserId(): Promise<number | null> {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  const [data, signature] = cookie.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
