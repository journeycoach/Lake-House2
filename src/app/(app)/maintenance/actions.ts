"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";

export async function addSchedule(formData: FormData) {
  await requireEditor();
  const task = String(formData.get("task") ?? "").trim();
  if (!task) return;
  await db.insert(schema.maintenance).values({
    task,
    details: String(formData.get("details") ?? "").trim() || null,
    cadence: String(formData.get("cadence") ?? "").trim() || null,
    nextDue: String(formData.get("nextDue") ?? "") || null,
    assignedTo: String(formData.get("assignedTo") ?? "").trim() || null,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/maintenance");
}

export async function updateDue(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const nextDue = String(formData.get("nextDue") ?? "");
  if (!id || !nextDue) return;
  await db
    .update(schema.maintenance)
    .set({ nextDue })
    .where(eq(schema.maintenance.id, id));
  revalidatePath("/maintenance");
}

export async function removeSchedule(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(schema.maintenance).where(eq(schema.maintenance.id, id));
  revalidatePath("/maintenance");
}
