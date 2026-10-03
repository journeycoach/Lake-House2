import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";
import { storageReport } from "@/lib/backup";

/*
  Weekly housekeeping, run by a scheduler with Authorization: Bearer CRON_SECRET.
  Pushes every admin a reminder to grab this week's backup from the Admin
  page's existing "Download a backup" button (GET /api/backup), which builds
  a fresh copy on demand. Push cannot carry a file attachment, so this is a
  nudge rather than a delivery; downloading still requires an admin session,
  same as it always has.
*/
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admins = await getDb()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));
  if (admins.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const storage = await storageReport();

  await sendPushToUsers(admins.map((a) => a.id), {
    title: storage.nearlyFull
      ? "Paine Pointe backup, and storage is filling up"
      : "Paine Pointe weekly backup",
    body: storage.nearlyFull
      ? "Tap to download this week's backup. History has grown enough to be worth clearing from the Admin page."
      : "Tap to download this week's backup.",
    url: "/api/backup",
  });

  return NextResponse.json({
    ok: true,
    sent: admins.length,
    nearlyFull: storage.nearlyFull,
  });
}
