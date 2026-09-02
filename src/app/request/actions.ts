"use server";

import { and, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { sendTemplateMail } from "@/lib/mail";
import { siteUrl } from "@/lib/email-template";
import { readText } from "@/lib/forms";

export type RequestState = { sent?: boolean; error?: string };

// A family generates a handful of these, ever. A burst past this in a short
// window is a bot, not a cousin.
const BURST_WINDOW_MINUTES = 10;
const BURST_LIMIT = 5;

/*
  Anyone can ask. Nothing is created but a row an admin has to act on: no
  account, no access, no email to the requester until someone approves.

  Two quiet defenses, both against automated submissions, both failing the
  same way a real success does (sent: true, nothing stored or emailed) so a
  bot gets no signal telling it what tripped:
  - "company" is a honeypot input, present in the form but hidden from real
    people by CSS. A script that fills every field walks into it.
  - A burst of requests in a short window gets dropped rather than paging
    every admin for each one.
*/
export async function requestAccess(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const name = readText(formData.get("name"), 200);
  const email = readText(formData.get("email"), 254).toLowerCase();
  const message = readText(formData.get("message"), 4000);
  const honeypot = readText(formData.get("company"), 200);
  if (!name || !email) return { error: "Name and email are both needed." };
  if (honeypot) return { sent: true };

  const windowStart = new Date(
    Date.now() - BURST_WINDOW_MINUTES * 60 * 1000
  ).toISOString();
  const recent = await getDb()
    .select({ id: schema.accessRequests.id })
    .from(schema.accessRequests)
    .where(gte(schema.accessRequests.createdAt, windowStart));
  if (recent.length >= BURST_LIMIT) return { sent: true };

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
