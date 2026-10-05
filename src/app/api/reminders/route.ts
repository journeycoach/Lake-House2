import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";
import { addDays, fmtDay, todayISO } from "@/lib/dates";
import { eq } from "drizzle-orm";

/*
  Vercel Cron calls GET /api/reminders daily with
  Authorization: Bearer CRON_SECRET.
  Pushes check-in reminders the day before a stay starts and checkout
  reminders on the last morning, to the stay's household members. Each
  notification opens the relevant section of that visit's checklist.
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
        body: `Your stay starts tomorrow, ${fmtDay(stay.start)}. Review the Stay Checklist before you head up.`,
        url: `/calendar/${stay.id}/checklist#stay-checklist`,
      });
    } else {
      await sendPushToUsers(members.map((m) => m.id), {
        title: "Paine Pointe: Leave Checklist today",
        body: `Today is your last day, ${fmtDay(stay.end)}. Review the Leave Checklist before heading home.`,
        url: `/calendar/${stay.id}/checklist#leave-checklist`,
      });
    }
    queued += members.length;
  }

  return NextResponse.json({ ok: true, queued });
}
