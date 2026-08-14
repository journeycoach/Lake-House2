"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";
import { canUpdateStayChecklist } from "@/lib/stay-checklist-access";

function phaseValue(value: unknown) {
  const phase = String(value);
  return phase === "checkout" || phase === "boat" ? phase : "checkin";
}

export async function addStayChecklistTemplate(formData: FormData) {
  const user = await requireAdmin();
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
  revalidatePath("/admin");
}

export async function removeStayChecklistTemplate(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const template = await getDb().query.stayChecklistTemplates.findFirst({
    where: eq(schema.stayChecklistTemplates.id, id),
  });
  if (!template) return;
  await getDb()
    .update(schema.stayChecklistTemplates)
    .set({ active: 0 })
    .where(eq(schema.stayChecklistTemplates.id, id));
  await logActivity(user, "removed a stay checklist step", template.title);
  revalidatePath("/calendar");
  revalidatePath("/guide");
  revalidatePath("/admin");
}

export async function updateStayChecklistTemplate(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get("id"));
  const title = readText(formData.get("title"), 200);
  if (!id || !title) return;
  const template = await getDb().query.stayChecklistTemplates.findFirst({
    where: eq(schema.stayChecklistTemplates.id, id),
  });
  if (!template || template.active !== 1) return;
  await getDb()
    .update(schema.stayChecklistTemplates)
    .set({ title })
    .where(eq(schema.stayChecklistTemplates.id, id));
  await logActivity(user, "edited a stay checklist step", `${template.title} → ${title}`);
  revalidatePath("/admin");
}

export async function moveStayChecklistTemplate(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get("id"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!id) return;
  const template = await getDb().query.stayChecklistTemplates.findFirst({
    where: eq(schema.stayChecklistTemplates.id, id),
  });
  if (!template || template.active !== 1) return;
  const siblings = await getDb()
    .select()
    .from(schema.stayChecklistTemplates)
    .where(eq(schema.stayChecklistTemplates.phase, template.phase))
    .orderBy(asc(schema.stayChecklistTemplates.position));
  const active = siblings.filter((item) => item.active === 1);
  const index = active.findIndex((item) => item.id === id);
  const other = active[index + direction];
  if (!other) return;
  await getDb()
    .update(schema.stayChecklistTemplates)
    .set({ position: other.position })
    .where(eq(schema.stayChecklistTemplates.id, template.id));
  await getDb()
    .update(schema.stayChecklistTemplates)
    .set({ position: template.position })
    .where(eq(schema.stayChecklistTemplates.id, other.id));
  await logActivity(user, "reordered a stay checklist step", template.title);
  revalidatePath("/admin");
}

export async function toggleStayChecklistItem(formData: FormData) {
  const user = await requireUser();
  const itemId = Number(formData.get("itemId"));
  if (!itemId) return;
  const item = await getDb().query.stayChecklistItems.findFirst({
    where: eq(schema.stayChecklistItems.id, itemId),
  });
  if (!item) return;
  const stay = await getDb().query.stays.findFirst({
    where: eq(schema.stays.id, item.stayId),
  });
  if (!stay) return;
  if (!canUpdateStayChecklist(user, stay)) return;

  await getDb()
    .update(schema.stayChecklistItems)
    .set(
      item.checkedAt
        ? { checkedBy: null, checkedAt: null }
        : { checkedBy: user.name, checkedAt: new Date().toISOString() }
    )
    .where(eq(schema.stayChecklistItems.id, item.id));
  await logActivity(
    user,
    item.checkedAt ? "unchecked a stay checklist step" : "checked a stay checklist step",
    `${stay.label}: ${item.title}`
  );
  revalidatePath("/calendar");
  revalidatePath("/guide");
  revalidatePath(`/calendar/${stay.id}/checklist`);
  revalidatePath("/");
}
