"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor, requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

function refresh() {
  revalidatePath("/checklist");
  revalidatePath("/");
}

async function groupItems(done: number) {
  return getDb()
    .select()
    .from(schema.checklist)
    .where(eq(schema.checklist.done, done))
    .orderBy(asc(schema.checklist.position), asc(schema.checklist.id));
}

async function normalizeGroup(done: number) {
  const rows = await groupItems(done);
  await Promise.all(
    rows.map((row, index) => {
      const position = index + 1;
      return row.position === position
        ? Promise.resolve()
        : getDb()
            .update(schema.checklist)
            .set({ position })
            .where(eq(schema.checklist.id, row.id));
    })
  );
}

export async function addItem(formData: FormData) {
  const user = await requireEditor();
  const title = readText(formData.get("title"), 200);
  if (!title) return;
  const rows = await groupItems(0);
  const position = Math.max(0, ...rows.map((r) => r.position)) + 1;
  await getDb().insert(schema.checklist).values({
    title,
    details: readText(formData.get("details"), 4000) || null,
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
  const nextDone = item.done ? 0 : 1;
  const targetRows = await groupItems(nextDone);
  const position = Math.max(0, ...targetRows.map((row) => row.position)) + 1;
  await getDb()
    .update(schema.checklist)
    .set({ done: nextDone, position })
    .where(eq(schema.checklist.id, id));
  await Promise.all([normalizeGroup(item.done), normalizeGroup(nextDone)]);
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
  if (item) await normalizeGroup(item.done);
  if (item) await logActivity(user, "removed a checklist item", item.title);
  refresh();
}

export async function moveItem(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")) === "up" ? -1 : 1;
  const item = await getDb().query.checklist.findFirst({
    where: eq(schema.checklist.id, id),
  });
  if (!item) return;
  await normalizeGroup(item.done);
  const rows = await groupItems(item.done);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const swap = rows[idx + dir];
  if (!swap) return;
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
