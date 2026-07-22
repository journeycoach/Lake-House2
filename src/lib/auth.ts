import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { readSession } from "./session";

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.uid),
  });
  return user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
