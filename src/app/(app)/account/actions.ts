"use server";

import bcrypt from "bcryptjs";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export type AccountState = { error?: string; saved?: boolean };

export async function updateProfile(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return { error: "Name and email are both required." };

  const taken = await getDb().query.users.findFirst({
    where: and(eq(schema.users.email, email), ne(schema.users.id, user.id)),
  });
  if (taken) return { error: "That email belongs to another account." };

  await getDb()
    .update(schema.users)
    .set({ name, email })
    .where(eq(schema.users.id, user.id));
  await logActivity({ id: user.id, name }, "updated their account details");
  revalidatePath("/account");
  revalidatePath("/");
  return { saved: true };
}

export async function changePassword(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8)
    return { error: "New password needs at least 8 characters." };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { error: "Current password is not right." };

  await getDb()
    .update(schema.users)
    .set({ passwordHash: bcrypt.hashSync(next, 10) })
    .where(eq(schema.users.id, user.id));
  await logActivity(user, "changed their password");
  revalidatePath("/account");
  return { saved: true };
}
