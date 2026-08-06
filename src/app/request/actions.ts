"use server";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { sendTemplateMail } from "@/lib/mail";
import { siteUrl } from "@/lib/email-template";
import { readText } from "@/lib/forms";

export type RequestState = { sent?: boolean; error?: string };

/*
  Anyone can ask. Nothing is created but a row an admin has to act on: no
  account, no access, no email to the requester until someone approves.
*/
export async function requestAccess(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const name = readText(formData.get("name"), 200);
  const email = readText(formData.get("email"), 254).toLowerCase();
  const message = readText(formData.get("message"), 4000);
  if (!name || !email) return { error: "Name and email are both needed." };

  const existingUser = await getDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  const pending = await getDb().query.accessRequests.findFirst({
    where: and(
      eq(schema.accessRequests.email, email),
      eq(schema.accessRequests.status, "pending")
    ),
  });

  // Someone who already has an account, or already asked, gets the same
  // confirmation as everyone else rather than a hint about who is on the list.
  if (existingUser || pending) return { sent: true };

  await getDb().insert(schema.accessRequests).values({
    name,
    email,
    message: message || null,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  const admins = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));

  for (const admin of admins) {
    await sendTemplateMail({
      to: admin.email,
      kind: "access-request",
      subject: `${name} asked to join Paine Pointe`,
      heading: "Someone asked to join",
      preview: `${name} requested access to Paine Pointe.`,
      blocks: [
        { type: "detail", label: "Name", value: name },
        { type: "detail", label: "Email", value: email },
        ...(message
          ? [{ type: "text" as const, text: `"${message}"` }]
          : []),
        {
          type: "button",
          label: "Review the request",
          href: `${siteUrl()}/admin#requests`,
        },
        {
          type: "quiet",
          text: "Nobody gets in until an admin approves them here.",
        },
      ],
    });
  }

  return { sent: true };
}
