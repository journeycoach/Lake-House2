import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { readSession } from "./session";
import { canEdit, type Role } from "./roles";

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.uid),
  });
  return user ?? null;
});

/*
  The user plus the role the app should behave as. Admins can preview a lower
  tier via the lh_viewas cookie; for everyone else the cookie is ignored.
*/
export const getEffectiveUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  let effectiveRole = user.role as Role;
  let viewingAs: Role | null = null;
  if (user.role === "admin") {
    const store = await cookies();
    const v = store.get("lh_viewas")?.value;
    if (v === "family" || v === "household") {
      effectiveRole = v;
      viewingAs = v;
    }
  }
  return { ...user, effectiveRole, viewingAs };
});

export async function requireUser() {
  const user = await getEffectiveUser();
  if (!user) redirect("/signin");
  return user;
}

/* For mutating actions on shared content. Family tier (real or previewed)
   cannot edit. */
export async function requireEditor() {
  const user = await requireUser();
  if (!canEdit(user.effectiveRole)) redirect("/");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.effectiveRole !== "admin") redirect("/");
  return user;
}
