import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "sw_session";
const MAX_AGE = 60 * 60 * 24 * 90;

/**
 * Anonymous session, used to rate-limit generation and to hang a customer's
 * work off before they have an account. httpOnly so it cannot be read or
 * forged from the page.
 */
export async function sessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
