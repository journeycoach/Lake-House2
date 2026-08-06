"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { sendTemplateMail } from "@/lib/mail";
import { siteUrl } from "@/lib/email-template";
import { createToken, readToken, spendToken } from "@/lib/tokens";
import { createSession } from "@/lib/session";
import type { Role } from "@/lib/roles";

export type ForgotState = { sent?: boolean; error?: string };

/*
  Always reports the same thing whether or not the address belongs to an
  account. Telling a stranger "no such account" would turn this form into a
  way to find out who is in the family.
*/
export async function requestReset(
  _prev: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Enter the email address you sign in with." };

  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (user) {
    const token = await createToken(user.id, "reset", 1);
    const link = `${siteUrl()}/reset/${token}`;
    await sendTemplateMail({
      to: user.email,
      kind: "password-reset",
      subject: "Reset your Paine Pointe password",
      heading: "Reset your password",
      preview: "A link to set a new password for Paine Pointe.",
      blocks: [
        { type: "text", text: `Hi ${user.name}, someone asked to reset the password for this account.` },
        { type: "button", label: "Set a new password", href: link },
        { type: "quiet", text: "The link works once and expires in an hour. If you did not ask for this, you can ignore this message and nothing changes." },
      ],
    });
  }

  return { sent: true };
}

export type ResetState = { error?: string };

export async function setNewPassword(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8)
    return { error: "Use at least 8 characters." };

  // A forgotten-password link and a new-member invite both land here, so
  // accept either kind.
  const row =
    (await readToken(token, "reset")) ?? (await readToken(token, "invite"));
  if (!row) return { error: "That link has expired or was already used." };

  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.id, row.userId),
  });
  if (!user) return { error: "That link is no longer valid." };

  await getDb()
    .update(schema.users)
    .set({
      passwordHash: bcrypt.hashSync(password, 10),
      mustChangePassword: 0,
      // Every other signed-in session for this account stops working.
      sessionVersion: sql`${schema.users.sessionVersion} + 1`,
    })
    .where(eq(schema.users.id, user.id));
  await spendToken(row.id);

  const [fresh] = await getDb()
    .select({ v: schema.users.sessionVersion })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));

  await createSession({
    uid: user.id,
    role: user.role as Role,
    name: user.name,
    v: fresh?.v ?? 0,
  });
  redirect("/");
}
