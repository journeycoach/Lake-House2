"use server";

import { and, asc, eq, gte, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { fmtRange } from "@/lib/dates";
import { readText } from "@/lib/forms";
import { sendPushToUsers } from "@/lib/push";

export type StayFormValues = ReturnType<typeof readStay>;
export type StayFormState = {
  error?: string;
  conflict?: string;
  added?: boolean;
  values?: StayFormValues;
};

function readStay(formData: FormData) {
  const label = readText(formData.get("label"), 200);
  const householdId = Number(formData.get("householdId") || 0) || null;
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const adults = Number(formData.get("adults") || 0);
  const kids = Number(formData.get("kids") || 0);
  const guestNames = readText(formData.get("guestNames"), 500) || null;
  const note = readText(formData.get("note"), 4000) || null;
  return { label, householdId, start, end, adults, kids, guestNames, note };
}

async function findConflicts(start: string, end: string, excludeId?: number) {
  return getDb()
    .select()
    .from(schema.stays)
    .where(
      and(
        lte(schema.stays.start, end),
        gte(schema.stays.end, start),
        excludeId ? ne(schema.stays.id, excludeId) : undefined
      )
    );
}

async function notifyOverlap(
  stay: ReturnType<typeof readStay>,
  conflicts: (typeof schema.stays.$inferSelect)[]
) {
  if (conflicts.length === 0) return;
  const householdIds = new Set(
    [stay.householdId, ...conflicts.map((conflict) => conflict.householdId)].filter(
      (id): id is number => Boolean(id)
    )
  );
  const users = await getDb().select().from(schema.users);
  const recipientIds = new Set(
    users
      .filter(
        (member) =>
          member.role === "admin" ||
          (member.householdId ? householdIds.has(member.householdId) : false)
      )
      .map((member) => member.id)
  );
  const otherNames = conflicts.map((conflict) => conflict.label).join(", ");

  await sendPushToUsers([...recipientIds], {
    title: "Shared dates at Paine Pointe",
    body: `${stay.label} (${fmtRange(stay.start, stay.end)}) shares dates with ${otherNames}. Coordinate sleeping arrangements and arrival timing before the overlap.`,
    url: "/calendar",
  });
}

export async function createStay(
  _prev: StayFormState,
  formData: FormData
): Promise<StayFormState> {
  const user = await requireEditor();
  const stay = readStay(formData);
  if (!stay.label) return { error: "Give the stay a name.", values: stay };
  if (!stay.start || !stay.end || stay.end < stay.start)
    return {
      error: "Check the dates: the end can not come before the start.",
      values: stay,
    };

  const conflicts = await findConflicts(stay.start, stay.end);
  const confirmed = formData.get("confirmConflict") === "1";
  if (conflicts.length > 0 && !confirmed) {
    const first = conflicts[0];
    return {
      conflict: `${first.label} is already booked ${fmtRange(first.start, first.end)}${conflicts.length > 1 ? `, along with ${conflicts.length - 1} other visit${conflicts.length === 2 ? "" : "s"}` : ""}. Save anyway if sharing the house is the plan.`,
      values: stay,
    };
  }

  const [createdStay] = await getDb().insert(schema.stays).values({
    ...stay,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }).returning({ id: schema.stays.id });
  const templates = await getDb()
    .select()
    .from(schema.stayChecklistTemplates)
    .where(eq(schema.stayChecklistTemplates.active, 1))
    .orderBy(
      asc(schema.stayChecklistTemplates.phase),
      asc(schema.stayChecklistTemplates.position)
  );
  if (createdStay && templates.length > 0) {
    const positions = new Map<string, number>();
    await getDb().insert(schema.stayChecklistItems).values(
      templates.map((template) => {
        const position = (positions.get(template.phase) ?? 0) + 1;
        positions.set(template.phase, position);
        return {
          stayId: createdStay.id,
          templateId: template.id,
          phase: template.phase,
          title: template.title,
          position,
        };
      })
    );
  }
  await logActivity(user, "booked a stay", `${stay.label}, ${fmtRange(stay.start, stay.end)}`);
  if (confirmed) await notifyOverlap(stay, conflicts);
  revalidatePath("/calendar");
  revalidatePath("/calendar/plan");
  revalidatePath("/");
  return { added: true };
}

export async function updateStay(
  _prev: StayFormState,
  formData: FormData
): Promise<StayFormState> {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const stay = readStay(formData);
  if (!id) return { error: "Missing stay.", values: stay };
  if (!stay.label) return { error: "Give the stay a name.", values: stay };
  if (!stay.start || !stay.end || stay.end < stay.start)
    return {
      error: "Check the dates: the end can not come before the start.",
      values: stay,
    };

  const conflicts = await findConflicts(stay.start, stay.end, id);
  const confirmed = formData.get("confirmConflict") === "1";
  if (conflicts.length > 0 && !confirmed) {
    const first = conflicts[0];
    return {
      conflict: `${first.label} is already booked ${fmtRange(first.start, first.end)}${conflicts.length > 1 ? `, along with ${conflicts.length - 1} other visit${conflicts.length === 2 ? "" : "s"}` : ""}. Save anyway if sharing the house is the plan.`,
      values: stay,
    };
  }

  await getDb().update(schema.stays).set(stay).where(eq(schema.stays.id, id));
  await logActivity(user, "edited a stay", `${stay.label}, ${fmtRange(stay.start, stay.end)}`);
  if (confirmed) await notifyOverlap(stay, conflicts);
  revalidatePath("/calendar");
  revalidatePath("/calendar/plan");
  revalidatePath("/");
  return {};
}

export async function deleteStay(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (id) {
    const stay = await getDb().query.stays.findFirst({
      where: eq(schema.stays.id, id),
    });
    await getDb().delete(schema.stays).where(eq(schema.stays.id, id));
    if (stay) {
      await logActivity(user, "removed a stay", `${stay.label}, ${fmtRange(stay.start, stay.end)}`);
    }
    revalidatePath("/calendar");
    revalidatePath("/calendar/plan");
    revalidatePath("/");
  }
}
