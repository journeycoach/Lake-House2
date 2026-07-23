"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor, requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function refresh() {
  revalidatePath("/checklist");
  revalidatePath("/");
}

export async function addItem(formData: FormData) {
  const user = await requireEditor();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const rows = await getDb().select().from(schema.checklist);
  const position = Math.max(0, ...rows.map((r) => r.position)) + 1;
  await getDb().insert(schema.checklist).values({
    title,
    details: String(formData.get("details") ?? "").trim() || null,
    addedBy: user.name,
    done: 0,
    position,
  });
  await logActivity(user, "added a checklist item", title);
  refresh();
}

/* Everyone signed in can check things off, family tier included. Clearing
   items out (remove, reorder, add) stays with household and admin. */
export async function toggleItem(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const item = await getDb().query.checklist.findFirst({
    where: eq(schema.checklist.id, id),
  });
  if (!item) return;
  await getDb()
    .update(schema.checklist)
    .set({ done: item.done ? 0 : 1 })
    .where(eq(schema.checklist.id, id));
  await logActivity(
    user,
    item.done ? "unchecked a checklist item" : "checked off a checklist item",
    item.title
  );
  refresh();
}

export async function removeItem(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const item = await getDb().query.checklist.findFirst({
    where: eq(schema.checklist.id, id),
  });
  await getDb().delete(schema.checklist).where(eq(schema.checklist.id, id));
  if (item) await logActivity(user, "removed a checklist item", item.title);
  refresh();
}

export async function moveItem(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")) === "up" ? -1 : 1;
  const rows = await getDb()
    .select()
    .from(schema.checklist)
    .orderBy(asc(schema.checklist.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = rows[idx + dir];
  if (idx === -1 || !swap) return;
  const a = rows[idx];
  await getDb()
    .update(schema.checklist)
    .set({ position: swap.position })
    .where(eq(schema.checklist.id, a.id));
  await getDb()
    .update(schema.checklist)
    .set({ position: a.position })
    .where(eq(schema.checklist.id, swap.id));
  refresh();
}
