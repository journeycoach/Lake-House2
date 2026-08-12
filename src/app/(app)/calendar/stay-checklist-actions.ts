"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor, requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

function phaseValue(value: unknown) {
  return String(value) === "checkout" ? "checkout" : "checkin";
}

export async function addStayChecklistTemplate(formData: FormData) {
  const user = await requireEditor();
  const phase = phaseValue(formData.get("phase"));
  const title = readText(formData.get("title"), 200);
  if (!title) return;
  const rows = await getDb()
    .select({ position: schema.stayChecklistTemplates.position })
    .from(schema.stayChecklistTemplates)
    .where(eq(schema.stayChecklistTemplates.phase, phase))
    .orderBy(asc(schema.stayChecklistTemplates.position));
  const position = Math.max(0, ...rows.map((row) => row.position)) + 1;
  await getDb().insert(schema.stayChecklistTemplates).values({
    phase,
    title,
    position,
    active: 1,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, `added a ${phase} checklist step`, title);
  revalidatePath("/calendar");
  revalidatePath("/guide");
}

export async function removeStayChecklistTemplate(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const template = await getDb().query.stayChecklistTemplates.findFirst({
    where: eq(schema.stayChecklistTemplates.id, id),
  });
  if (!template) return;
  await getDb()
    .delete(schema.stayChecklistTemplates)
    .where(eq(schema.stayChecklistTemplates.id, id));
  await logActivity(user, "removed a stay checklist step", template.title);
  revalidatePath("/calendar");
  revalidatePath("/guide");
}

export async function toggleStayChecklistItem(formData: FormData) {
  const user = await requireUser();
  const stayId = Number(formData.get("stayId"));
  const templateId = Number(formData.get("templateId"));
  if (!stayId || !templateId) return;

  const [stay, template, completion] = await Promise.all([
    getDb().query.stays.findFirst({ where: eq(schema.stays.id, stayId) }),
    getDb().query.stayChecklistTemplates.findFirst({
      where: and(
        eq(schema.stayChecklistTemplates.id, templateId),
        eq(schema.stayChecklistTemplates.active, 1)
      ),
    }),
    getDb().query.stayChecklistCompletions.findFirst({
      where: and(
        eq(schema.stayChecklistCompletions.stayId, stayId),
        eq(schema.stayChecklistCompletions.templateId, templateId)
      ),
    }),
  ]);
  if (!stay || !template) return;

  if (completion) {
    await getDb()
      .delete(schema.stayChecklistCompletions)
      .where(eq(schema.stayChecklistCompletions.id, completion.id));
  } else {
    await getDb()
      .insert(schema.stayChecklistCompletions)
      .values({
        stayId,
        templateId,
        checkedBy: user.name,
        checkedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();
  }
  await logActivity(
    user,
    completion ? "unchecked a stay checklist step" : "checked a stay checklist step",
    `${stay.label}: ${template.title}`
  );
  revalidatePath("/calendar");
  revalidatePath("/guide");
}
