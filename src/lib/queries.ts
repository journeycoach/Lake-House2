import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { todayISO } from "./dates";

export type StayRow = {
  id: number;
  label: string;
  start: string;
  end: string;
  adults: number;
  kids: number;
  note: string | null;
  color: string;
};

export async function allStays(): Promise<StayRow[]> {
  const rows = await getDb()
    .select({
      id: schema.stays.id,
      label: schema.stays.label,
      start: schema.stays.start,
      end: schema.stays.end,
      adults: schema.stays.adults,
      kids: schema.stays.kids,
      note: schema.stays.note,
      color: schema.households.color,
    })
    .from(schema.stays)
    .leftJoin(
      schema.households,
      eq(schema.stays.householdId, schema.households.id)
    )
    .orderBy(asc(schema.stays.start));
  return rows.map((r) => ({ ...r, color: r.color ?? "steel" }));
}

export function staysNow(stays: StayRow[], today = todayISO()): StayRow[] {
  return stays.filter((s) => s.start <= today && today <= s.end);
}

export function staysUpcoming(stays: StayRow[], today = todayISO()): StayRow[] {
  return stays.filter((s) => s.start > today);
}

export async function latestNotes(limit?: number) {
  const rows = await getDb()
    .select()
    .from(schema.notes)
    .orderBy(desc(schema.notes.createdAt), desc(schema.notes.id));
  return limit ? rows.slice(0, limit) : rows;
}

export async function openFixit() {
  const order = { urgent: 0, soon: 1, whenever: 2 } as Record<string, number>;
  const rows = await getDb()
    .select()
    .from(schema.fixit)
    .where(eq(schema.fixit.status, "open"));
  return rows.sort(
    (a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
  );
}

export async function checklistItems() {
  return getDb()
    .select()
    .from(schema.checklist)
    .orderBy(
      asc(schema.checklist.done),
      asc(schema.checklist.position),
      asc(schema.checklist.id)
    );
}

export async function maintenanceItems() {
  return getDb()
    .select()
    .from(schema.maintenance)
    .orderBy(asc(schema.maintenance.nextDue));
}

export async function guideSections() {
  return getDb()
    .select()
    .from(schema.guideSections)
    .orderBy(asc(schema.guideSections.position));
}
