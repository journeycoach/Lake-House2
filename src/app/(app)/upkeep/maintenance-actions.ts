"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function addSchedule(formData: FormData) {
  const user = await requireEditor();
  const task = String(formData.get("task") ?? "").trim();
  if (!task) return;
  await getDb().insert(schema.maintenance).values({
    task,
    details: String(formData.get("details") ?? "").trim() || null,
    cadence: String(formData.get("cadence") ?? "").trim() || null,
    nextDue: String(formData.get("nextDue") ?? "") || null,
    assignedTo: String(formData.get("assignedTo") ?? "").trim() || null,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "added a maintenance schedule", task);
  revalidatePath("/upkeep");
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
  revalidatePath("/upkeep");
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
  revalidatePath("/upkeep");
}
