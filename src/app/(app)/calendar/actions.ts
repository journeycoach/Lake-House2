"use server";

import { and, eq, gte, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { fmtRange } from "@/lib/dates";

export type StayFormState = { error?: string; conflict?: string };

function readStay(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const householdId = Number(formData.get("householdId") || 0) || null;
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const adults = Number(formData.get("adults") || 0);
  const kids = Number(formData.get("kids") || 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  return { label, householdId, start, end, adults, kids, note };
}

async function findConflict(start: string, end: string, excludeId?: number) {
  const overlapping = await db
    .select()
    .from(schema.stays)
    .where(
      and(
        lte(schema.stays.start, end),
        gte(schema.stays.end, start),
        excludeId ? ne(schema.stays.id, excludeId) : undefined
      )
    );
  return overlapping[0] ?? null;
}

export async function createStay(
  _prev: StayFormState,
  formData: FormData
): Promise<StayFormState> {
  const user = await requireEditor();
  const stay = readStay(formData);
  if (!stay.label) return { error: "Give the stay a name." };
  if (!stay.start || !stay.end || stay.end < stay.start)
    return { error: "Check the dates: the end can not come before the start." };

  const conflict = await findConflict(stay.start, stay.end);
  const confirmed = formData.get("confirmConflict") === "1";
  if (conflict && !confirmed) {
    return {
      conflict: `${conflict.label} is already booked ${fmtRange(conflict.start, conflict.end)}. Save anyway if sharing the house is the plan.`,
    };
  }

  await db.insert(schema.stays).values({
    ...stay,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}

export async function updateStay(
  _prev: StayFormState,
  formData: FormData
): Promise<StayFormState> {
  await requireEditor();
  const id = Number(formData.get("id"));
  const stay = readStay(formData);
  if (!id) return { error: "Missing stay." };
  if (!stay.label) return { error: "Give the stay a name." };
  if (!stay.start || !stay.end || stay.end < stay.start)
    return { error: "Check the dates: the end can not come before the start." };

  const conflict = await findConflict(stay.start, stay.end, id);
  const confirmed = formData.get("confirmConflict") === "1";
  if (conflict && !confirmed) {
    return {
      conflict: `${conflict.label} is already booked ${fmtRange(conflict.start, conflict.end)}. Save anyway if sharing the house is the plan.`,
    };
  }

  await db.update(schema.stays).set(stay).where(eq(schema.stays.id, id));
  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}

export async function deleteStay(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  if (id) {
    await db.delete(schema.stays).where(eq(schema.stays.id, id));
    revalidatePath("/calendar");
    revalidatePath("/");
  }
}
