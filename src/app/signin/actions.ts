"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import type { Role } from "@/lib/roles";
import { readText } from "@/lib/forms";

export type SignInState = { error?: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = readText(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const now = new Date().toISOString();

  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  await getDb().insert(schema.loginEvents).values({
    email,
    userId: user?.id ?? null,
    success: ok ? 1 : 0,
    at: now,
  });

  if (!user || !ok) {
    return { error: "That email and password combination did not work." };
  }

  await createSession({
    uid: user.id,
    name: user.name,
    role: user.role as Role,
  });
  redirect("/");
}

export async function signOut() {
  await destroySession();
  redirect("/signin");
}
