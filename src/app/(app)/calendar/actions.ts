"use server";

import { and, eq, gte, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { fmtRange } from "@/lib/dates";
import { readText } from "@/lib/forms";
import { sendTemplateMail } from "@/lib/mail";
import { siteUrl } from "@/lib/email-template";

export type StayFormState = { error?: string; conflict?: string };

function readStay(formData: FormData) {
  const label = readText(formData.get("label"), 200);
  const householdId = Number(formData.get("householdId") || 0) || null;
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const adults = Number(formData.get("adults") || 0);
  const kids = Number(formData.get("kids") || 0);
  const note = readText(formData.get("note"), 4000) || null;
  return { label, householdId, start, end, adults, kids, note };
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
  const recipients = new Map(
    users
      .filter(
        (member) =>
          member.role === "admin" ||
          (member.householdId ? householdIds.has(member.householdId) : false)
      )
      .map((member) => [member.email.toLowerCase(), member])
  );
  const otherNames = conflicts.map((conflict) => conflict.label).join(", ");

  await Promise.all(
    [...recipients.values()].map((member) =>
      sendTemplateMail({
        to: member.email,
        kind: "overlap-notice",
        subject: `Shared dates at Paine Pointe: ${stay.label} and ${otherNames}`,
        heading: "Two family visits overlap",
        preview: `${stay.label} shares dates with ${otherNames}.`,
        blocks: [
          {
            type: "text",
            text: "The visits were saved as an intentional overlap. Please coordinate sleeping arrangements, arrival timing, and anything the house needs before the shared dates.",
          },
          {
            type: "detail",
            label: stay.label,
            value: fmtRange(stay.start, stay.end),
          },
          ...conflicts.map((conflict) => ({
            type: "detail" as const,
            label: conflict.label,
            value: fmtRange(conflict.start, conflict.end),
          })),
          {
            type: "button",
            label: "Open the family calendar",
            href: `${siteUrl()}/calendar`,
          },
        ],
      })
    )
  );
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

  const conflicts = await findConflicts(stay.start, stay.end);
  const confirmed = formData.get("confirmConflict") === "1";
  if (conflicts.length > 0 && !confirmed) {
    const first = conflicts[0];
    return {
      conflict: `${first.label} is already booked ${fmtRange(first.start, first.end)}${conflicts.length > 1 ? `, along with ${conflicts.length - 1} other visit${conflicts.length === 2 ? "" : "s"}` : ""}. Save anyway if sharing the house is the plan.`,
    };
  }

  await getDb().insert(schema.stays).values({
    ...stay,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "booked a stay", `${stay.label}, ${fmtRange(stay.start, stay.end)}`);
  if (confirmed) await notifyOverlap(stay, conflicts);
  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}

export async function updateStay(
  _prev: StayFormState,
  formData: FormData
): Promise<StayFormState> {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const stay = readStay(formData);
  if (!id) return { error: "Missing stay." };
  if (!stay.label) return { error: "Give the stay a name." };
  if (!stay.start || !stay.end || stay.end < stay.start)
    return { error: "Check the dates: the end can not come before the start." };

  const conflicts = await findConflicts(stay.start, stay.end, id);
  const confirmed = formData.get("confirmConflict") === "1";
  if (conflicts.length > 0 && !confirmed) {
    const first = conflicts[0];
    return {
      conflict: `${first.label} is already booked ${fmtRange(first.start, first.end)}${conflicts.length > 1 ? `, along with ${conflicts.length - 1} other visit${conflicts.length === 2 ? "" : "s"}` : ""}. Save anyway if sharing the house is the plan.`,
    };
  }

  await getDb().update(schema.stays).set(stay).where(eq(schema.stays.id, id));
  await logActivity(user, "edited a stay", `${stay.label}, ${fmtRange(stay.start, stay.end)}`);
  if (confirmed) await notifyOverlap(stay, conflicts);
  revalidatePath("/calendar");
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
    revalidatePath("/");
  }
}
