import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { sendTemplateMail } from "@/lib/mail";
import { siteUrl } from "@/lib/email-template";
import { buildBackup, backupFilename, storageReport } from "@/lib/backup";

/*
  Weekly housekeeping, run by a scheduler with Authorization: Bearer CRON_SECRET.
  Emails every admin a copy of the whole database as an attachment, so backups
  end up in more than one inbox without any storage to maintain, and says so
  plainly when history has grown enough to be worth clearing.
*/
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admins = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));
  if (admins.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const backup = await buildBackup();
  const storage = await storageReport();
  const filename = backupFilename(backup.takenAt);
  const content = Buffer.from(JSON.stringify(backup, null, 2)).toString("base64");

  const bookings = backup.rows.stays?.length ?? 0;
  const notes = backup.rows.notes?.length ?? 0;

  for (const admin of admins) {
    await sendTemplateMail({
      to: admin.email,
      kind: "weekly-backup",
      subject: storage.nearlyFull
        ? "Paine Pointe backup, and storage is filling up"
        : "Paine Pointe weekly backup",
      heading: "This week's backup",
      preview: "A copy of everything on Paine Pointe is attached.",
      blocks: [
        {
          type: "text",
          text: "Attached is a copy of everything on the site. Keep it somewhere you can find it. If anything ever goes wrong, this file is how it comes back.",
        },
        { type: "detail", label: "Bookings", value: String(bookings) },
        { type: "detail", label: "Family notes", value: String(notes) },
        {
          type: "detail",
          label: "History entries",
          value: storage.historyRows.toLocaleString(),
        },
        ...(storage.nearlyFull
          ? [
              {
                type: "text" as const,
                text: "History has grown enough to be worth clearing. Nothing is wrong, and nothing the family wrote is at risk, but the Admin page can trim old activity, sign-in records, and sent mail whenever you feel like it.",
              },
              {
                type: "button" as const,
                label: "Open the Admin page",
                href: `${siteUrl()}/admin`,
              },
            ]
          : []),
      ],
      attachments: [{ filename, content }],
    });
  }

  return NextResponse.json({
    ok: true,
    sent: admins.length,
    nearlyFull: storage.nearlyFull,
  });
}
