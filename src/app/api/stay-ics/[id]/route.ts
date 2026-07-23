import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { buildCalendar } from "@/lib/ics";

/* Single-stay .ics download ("Add to calendar"). Session-guarded by proxy. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stay = await getDb().query.stays.findFirst({
    where: eq(schema.stays.id, Number(id)),
  });
  if (!stay) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const slug = stay.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return new NextResponse(buildCalendar([stay]), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lakehouse-${slug}.ics"`,
    },
  });
}
