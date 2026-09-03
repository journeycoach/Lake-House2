"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

function refresh() {
  revalidatePath("/upkeep");
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function addSchedule(formData: FormData) {
  const user = await requireEditor();
  const task = readText(formData.get("task"), 200);
  if (!task) return;
  await getDb().insert(schema.maintenance).values({
    equipmentId: Number(formData.get("equipmentId") || 0) || null,
    task,
    details: readText(formData.get("details"), 4000) || null,
    cadence: readText(formData.get("cadence"), 200) || null,
    nextDue: String(formData.get("nextDue") ?? "") || null,
    assignedTo: readText(formData.get("assignedTo"), 200) || null,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "added a maintenance schedule", task);
  refresh();
}

export async function updateDue(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const nextDue = String(formData.get("nextDue") ?? "");
  if (!id || !nextDue) return;
  await getDb()
    .update(schema.maintenance)
    .set({ nextDue })
    .where(eq(schema.maintenance.id, id));
  const item = await getDb().query.maintenance.findFirst({
    where: eq(schema.maintenance.id, id),
  });
  if (item) await logActivity(user, "set a maintenance due date", `${item.task}, ${nextDue}`);
  refresh();
}

export async function updateMaintenance(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const task = readText(formData.get("task"), 200);
  if (!task) return;
  await getDb()
    .update(schema.maintenance)
    .set({
      task,
      cadence: readText(formData.get("cadence"), 200) || null,
      assignedTo: readText(formData.get("assignedTo"), 200) || null,
      details: readText(formData.get("details"), 4000) || null,
      equipmentId: Number(formData.get("equipmentId") || 0) || null,
      nextDue: String(formData.get("nextDue") ?? "") || null,
    })
    .where(eq(schema.maintenance.id, id));
  await logActivity(user, "updated a maintenance schedule", task);
  refresh();
}

export async function removeSchedule(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const item = await getDb().query.maintenance.findFirst({
    where: eq(schema.maintenance.id, id),
  });
  await getDb().delete(schema.maintenance).where(eq(schema.maintenance.id, id));
  if (item) await logActivity(user, "removed a maintenance schedule", item.task);
  refresh();
}
