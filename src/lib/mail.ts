import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

/*
  Every email lands in the outbox table first, so admins can always see what
  the app tried to say. If RESEND_API_KEY is set, it actually sends through
  Resend; without it the app runs fine and just logs.
*/
export async function sendMail({
  to,
  subject,
  body,
  kind,
}: {
  to: string;
  subject: string;
  body: string;
  kind: string;
}) {
  const [row] = await db
    .insert(schema.outbox)
    .values({
      toEmail: to,
      subject,
      body,
      kind,
      status: "logged",
      createdAt: new Date().toISOString(),
    })
    .returning();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { delivered: false as const };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "The Lakehouse <onboarding@resend.dev>",
        to: [to],
        subject,
        text: body,
      }),
    });
    const status = res.ok ? "sent" : "failed";
    await db
      .update(schema.outbox)
      .set({ status })
      .where(eq(schema.outbox.id, row.id));
    return { delivered: res.ok };
  } catch {
    await db
      .update(schema.outbox)
      .set({ status: "failed" })
      .where(eq(schema.outbox.id, row.id));
    return { delivered: false as const };
  }
}
