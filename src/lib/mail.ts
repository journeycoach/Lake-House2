import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { renderEmail, type EmailBlock } from "./email-template";

/*
  Every email lands in the outbox table first, so admins can always see what
  the app tried to say. If RESEND_API_KEY is set, it actually sends through
  Resend; without it the app runs fine and just logs.
*/

const FROM = process.env.MAIL_FROM ?? "Paine Pointe <lakehouse@paines.com>";
const REPLY_TO = process.env.MAIL_REPLY_TO;

type Attachment = { filename: string; content: string };

async function deliver(
  to: string,
  subject: string,
  text: string,
  kind: string,
  html?: string,
  attachments?: Attachment[]
) {
  const [row] = await getDb()
    .insert(schema.outbox)
    .values({
      toEmail: to,
      subject,
      body: text,
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
        from: FROM,
        to: [to],
        ...(REPLY_TO ? { reply_to: [REPLY_TO] } : {}),
        subject,
        text,
        ...(html ? { html } : {}),
        ...(attachments?.length ? { attachments } : {}),
      }),
    });
    const status = res.ok ? "sent" : "failed";
    await getDb()
      .update(schema.outbox)
      .set({ status })
      .where(eq(schema.outbox.id, row.id));
    return { delivered: res.ok };
  } catch {
    await getDb()
      .update(schema.outbox)
      .set({ status: "failed" })
      .where(eq(schema.outbox.id, row.id));
    return { delivered: false as const };
  }
}

/* Plain message. Kept so existing callers keep working unchanged. */
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
  return deliver(to, subject, body, kind);
}

/* Branded message: same shell for every kind of mail the house sends. */
export async function sendTemplateMail({
  to,
  subject,
  heading,
  preview,
  blocks,
  kind,
  attachments,
}: {
  to: string;
  subject: string;
  heading: string;
  preview?: string;
  blocks: EmailBlock[];
  kind: string;
  attachments?: Attachment[];
}) {
  const { html, text } = renderEmail({
    heading,
    preview: preview ?? heading,
    blocks,
  });
  return deliver(to, subject, text, kind, html, attachments);
}
