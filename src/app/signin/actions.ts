"use server";

import bcrypt from "bcryptjs";
import { and, eq, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import type { Role } from "@/lib/roles";
import { readText } from "@/lib/forms";

export type SignInState = { error?: string };

// login_events already gets a row for every attempt, success or failure, so
// it doubles as the lockout counter: no new table needed. Generous enough
// that a family member fumbling their password a few times never gets
// caught by it, tight enough to slow down a script guessing passwords.
const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_THRESHOLD = 8;

export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = readText(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const now = new Date().toISOString();

  const windowStart = new Date(
    Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();
  const recentFailures = await getDb()
    .select({ id: schema.loginEvents.id })
    .from(schema.loginEvents)
    .where(
      and(
        eq(schema.loginEvents.email, email),
        eq(schema.loginEvents.success, 0),
        gte(schema.loginEvents.at, windowStart)
      )
    );
  const lockedOut = recentFailures.length >= LOCKOUT_THRESHOLD;

  // Skip the password check entirely once locked out, so a script can't
  // keep spending our CPU on bcrypt while it waits out the window.
  const user = lockedOut
    ? undefined
    : await getDb().query.users.findFirst({
        where: eq(schema.users.email, email),
      });

  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  await getDb().insert(schema.loginEvents).values({
    email,
    userId: user?.id ?? null,
    success: ok ? 1 : 0,
    at: now,
  });

  if (lockedOut) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  if (!user || !ok) {
    return { error: "That email and password combination did not work." };
  }

  await createSession({
    uid: user.id,
    name: user.name,
    role: user.role as Role,
    v: user.sessionVersion,
  });
  redirect("/");
}

export async function signOut() {
  await destroySession();
  redirect("/signin");
}
