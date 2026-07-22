"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";

function refresh() {
  revalidatePath("/checklist");
  revalidatePath("/");
}

export async function addItem(formData: FormData) {
  const user = await requireEditor();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const rows = await db.select().from(schema.checklist);
  const position = Math.max(0, ...rows.map((r) => r.position)) + 1;
  await db.insert(schema.checklist).values({
    title,
    details: String(formData.get("details") ?? "").trim() || null,
    addedBy: user.name,
    done: 0,
    position,
  });
  refresh();
}

export async function toggleItem(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const item = await db.query.checklist.findFirst({
    where: eq(schema.checklist.id, id),
  });
  if (!item) return;
  await db
    .update(schema.checklist)
    .set({ done: item.done ? 0 : 1 })
    .where(eq(schema.checklist.id, id));
  refresh();
}

export async function removeItem(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(schema.checklist).where(eq(schema.checklist.id, id));
  refresh();
}

export async function moveItem(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")) === "up" ? -1 : 1;
  const rows = await db
    .select()
    .from(schema.checklist)
    .orderBy(asc(schema.checklist.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = rows[idx + dir];
  if (idx === -1 || !swap) return;
  const a = rows[idx];
  await db
    .update(schema.checklist)
    .set({ position: swap.position })
    .where(eq(schema.checklist.id, a.id));
  await db
    .update(schema.checklist)
    .set({ position: a.position })
    .where(eq(schema.checklist.id, swap.id));
  refresh();
}
