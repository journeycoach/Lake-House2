import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { buildCalendar } from "@/lib/ics";
import { getFeedToken } from "@/lib/feed-token";

/*
  Subscribable calendar feed. Calendar apps poll this URL on their own
  schedule, so changes to stays show up for everyone automatically. The token
  in the path is the only auth a calendar client can carry.
*/
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const expected = await getFeedToken();
  if (token.replace(/\.ics$/, "") !== expected) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const stays = await db
    .select()
    .from(schema.stays)
    .orderBy(asc(schema.stays.start));

  return new NextResponse(buildCalendar(stays), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="lakehouse.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
