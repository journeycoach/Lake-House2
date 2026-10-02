import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";
import { addDays, fmtDay, todayISO } from "@/lib/dates";
import { eq } from "drizzle-orm";

/*
  Reminder cron. Point a scheduler (Vercel cron later) at
  GET /api/reminders with Authorization: Bearer CRON_SECRET.
  Pushes check-in reminders the day before a stay starts and checkout
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
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.householdId, stay.householdId));
    if (members.length === 0) continue;

    if (isCheckin) {
      await sendPushToUsers(members.map((m) => m.id), {
        title: `Paine Pointe tomorrow: ${stay.label}`,
        body: `Your stay starts tomorrow, ${fmtDay(stay.start)}. Review the check-in steps and the shared checklist before you head up.`,
        url: "/calendar",
      });
    } else {
      await sendPushToUsers(members.map((m) => m.id), {
        title: "Paine Pointe checkout today",
        body: `Today is checkout day, ${fmtDay(stay.end)}. Complete the check-out steps before leaving.`,
        url: "/calendar",
      });
    }
    queued += members.length;
  }

  return NextResponse.json({ ok: true, queued });
}
