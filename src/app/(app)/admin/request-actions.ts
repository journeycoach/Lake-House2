"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendTemplateMail } from "@/lib/mail";
import { siteUrl } from "@/lib/email-template";
import { createToken } from "@/lib/tokens";
import { logActivity } from "@/lib/activity";

function readRole(value: unknown): string {
  const v = String(value);
  return v === "admin" || v === "household" || v === "family" ? v : "family";
}

export async function approveRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const role = readRole(formData.get("role"));
  const householdId = Number(formData.get("householdId") || 0) || null;
  if (!id) return;

  const req = await getDb().query.accessRequests.findFirst({
    where: eq(schema.accessRequests.id, id),
  });
  if (!req || req.status !== "pending") return;

  const existing = await getDb().query.users.findFirst({
    where: eq(schema.users.email, req.email),
  });

  let userId = existing?.id;
  if (!existing) {
    // No usable password is ever set: the account can only be opened by the
    // invite link, which the person turns into a password of their own.
    const [created] = await getDb()
      .insert(schema.users)
      .values({
        name: req.name,
        email: req.email,
        passwordHash: bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10),
        role,
        householdId,
        createdAt: new Date().toISOString(),
        mustChangePassword: 1,
      })
      .returning({ id: schema.users.id });
    userId = created.id;
  }

  try {
    await getDb()
      .update(schema.accessRequests)
      .set({
        status: "approved",
        decidedBy: admin.name,
        decidedAt: new Date().toISOString(),
      })
      .where(eq(schema.accessRequests.id, id));

    if (userId) {
      const token = await createToken(userId, "invite", 72);
      await sendTemplateMail({
        to: req.email,
        kind: "invite",
        subject: "You are in: Paine Pointe",
        heading: "Welcome to Paine Pointe",
        preview: "Set a password and you are in.",
        blocks: [
          { type: "text", text: `Hi ${req.name}, ${admin.name} let you in to Paine Pointe. Pick a password and you can see the calendar, notes, and house guide.` },
          { type: "button", label: "Set your password", href: `${siteUrl()}/reset/${token}` },
          { type: "quiet", text: "This link works once and lasts three days. If it expires, use the forgot-password link on the sign-in page." },
        ],
      });
    }

    await logActivity(admin, "approved an access request", req.email);
  } catch (error) {
    // The account may already be created above even if a later step here
    // failed. Log it instead of crashing the Admin page so the admin can
    // see what actually happened and retry or fix it by hand.
    console.error("approveRequest failed", { id, error });
    return;
  }
  revalidatePath("/admin");
}

export async function declineRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const req = await getDb().query.accessRequests.findFirst({
    where: eq(schema.accessRequests.id, id),
  });
  if (!req || req.status !== "pending") return;

  try {
    await getDb()
      .update(schema.accessRequests)
      .set({
        status: "declined",
        decidedBy: admin.name,
        decidedAt: new Date().toISOString(),
      })
      .where(eq(schema.accessRequests.id, id));

    // Deliberately silent: nobody gets an email telling them they were
    // turned down. An admin who wants to explain can do it in person.
    await logActivity(admin, "declined an access request", req.email);
  } catch (error) {
    console.error("declineRequest failed", { id, error });
    return;
  }
  revalidatePath("/admin");
}
