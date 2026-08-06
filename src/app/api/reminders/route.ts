import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { addDays, fmtDay, todayISO } from "@/lib/dates";
import { eq } from "drizzle-orm";

/*
  Reminder cron. Point a scheduler (Vercel cron later) at
  GET /api/reminders with Authorization: Bearer CRON_SECRET.
  Sends check-in reminders the day before a stay starts and checkout
  reminders on the last morning, to the stay's household members.
*/
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const stays = await getDb().select().from(schema.stays);
  let queued = 0;

  for (const stay of stays) {
    const isCheckin = stay.start === tomorrow;
    const isCheckout = stay.end === today;
    if (!isCheckin && !isCheckout) continue;
    if (!stay.householdId) continue;

    const members = await getDb()
      .select()
      .from(schema.users)
      .where(eq(schema.users.householdId, stay.householdId));

    for (const member of members) {
      if (isCheckin) {
        await sendMail({
          to: member.email,
          subject: `Paine Pointe tomorrow: ${stay.label}`,
          body: `Your stay starts tomorrow, ${fmtDay(stay.start)}.\n\nBefore you head up, check the house guide for the door code and arrival steps, and glance at the shared checklist for anything to bring.\n\nPaine Pointe`,
          kind: "checkin-reminder",
        });
      } else {
        await sendMail({
          to: member.email,
          subject: "Paine Pointe checkout today",
          body: `Today is checkout day, ${fmtDay(stay.end)}.\n\nThe departure checklist is in the house guide: thermostat, linens, trash, doors, and windows.\n\nPaine Pointe`,
          kind: "checkout-reminder",
        });
      }
      queued++;
    }
  }

  return NextResponse.json({ ok: true, queued });
}
